package chat

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"kostify/backend/internal/http/middleware"
	"kostify/backend/internal/http/response"
	"kostify/backend/internal/models"
)

type Repository struct{ db *gorm.DB }

func NewRepository(db *gorm.DB) *Repository { return &Repository{db: db} }

// GetOrCreate returns the 1:1 conversation between two users (ordered pair).
func (r *Repository) GetOrCreate(ctx context.Context, a, b uuid.UUID) (*models.Conversation, error) {
	if a.String() > b.String() {
		a, b = b, a
	}
	var conv models.Conversation
	err := r.db.WithContext(ctx).
		Where("participant_a = ? AND participant_b = ?", a, b).
		First(&conv).Error
	if err == nil {
		return &conv, nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	conv = models.Conversation{ParticipantA: a, ParticipantB: b}
	if err := r.db.WithContext(ctx).Create(&conv).Error; err != nil {
		return nil, err
	}
	return &conv, nil
}

type convRow struct {
	models.Conversation
	LastMessage    *string    `json:"last_message"`
	LastMessageAt  *time.Time `json:"last_message_at"`
	OtherID        uuid.UUID  `json:"other_id"`
	OtherName      string     `json:"other_name"`
	OtherRole      string     `json:"other_role"`
	UnreadCount    int64      `json:"unread_count"`
}

func (r *Repository) ListForUser(ctx context.Context, userID uuid.UUID) ([]convRow, error) {
	var rows []convRow
	err := r.db.WithContext(ctx).Raw(`
		SELECT c.*,
		       (SELECT m.body FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
		       (SELECT m.created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_at,
		       CASE WHEN c.participant_a = ? THEN c.participant_b ELSE c.participant_a END AS other_id,
		       u2.name AS other_name, u2.role::text AS other_role,
		       (SELECT count(*) FROM messages m WHERE m.conversation_id = c.id AND m.sender_id <> ? AND m.read_at IS NULL) AS unread_count
		FROM conversations c
		JOIN users u2 ON u2.id = CASE WHEN c.participant_a = ? THEN c.participant_b ELSE c.participant_a END
		WHERE c.participant_a = ? OR c.participant_b = ?
		ORDER BY last_message_at DESC NULLS LAST, c.created_at DESC
	`, userID, userID, userID, userID, userID).Scan(&rows).Error
	return rows, err
}

// IsParticipant checks user is part of the conversation.
func (r *Repository) IsParticipant(ctx context.Context, convID, userID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.Conversation{}).
		Where("id = ? AND (participant_a = ? OR participant_b = ?)", convID, userID, userID).
		Count(&count).Error
	return count > 0, err
}

func (r *Repository) Messages(ctx context.Context, convID uuid.UUID, limit int) ([]models.Message, error) {
	var msgs []models.Message
	err := r.db.WithContext(ctx).Preload("Sender", func(db *gorm.DB) *gorm.DB {
		return db.Select("id, name, role")
	}).Where("conversation_id = ?", convID).Order("created_at DESC").Limit(limit).Find(&msgs).Error
	// reverse ke urutan lama→baru
	for i, j := 0, len(msgs)-1; i < j; i, j = i+1, j-1 {
		msgs[i], msgs[j] = msgs[j], msgs[i]
	}
	return msgs, err
}

func (r *Repository) SendMessage(ctx context.Context, m *models.Message) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(m).Error; err != nil {
			return err
		}
		return tx.Model(&models.Conversation{}).Where("id = ?", m.ConversationID).Update("updated_at", time.Now()).Error
	})
}

// MarkRead marks all incoming messages read for user.
func (r *Repository) MarkRead(ctx context.Context, convID, userID uuid.UUID) error {
	return r.db.WithContext(ctx).Model(&models.Message{}).
		Where("conversation_id = ? AND sender_id <> ? AND read_at IS NULL", convID, userID).
		Update("read_at", time.Now()).Error
}

func (r *Repository) TotalUnread(ctx context.Context, userID uuid.UUID) (int64, error) {
	var n int64
	err := r.db.WithContext(ctx).Model(&models.Message{}).Raw(`
		SELECT count(*) FROM messages m
		JOIN conversations c ON c.id = m.conversation_id
		WHERE (c.participant_a = ? OR c.participant_b = ?) AND m.sender_id <> ? AND m.read_at IS NULL
	`, userID, userID, userID).Scan(&n).Error
	return n, err
}

type Service struct{ repo *Repository }

func NewService(repo *Repository) *Service { return &Service{repo: repo} }

func (s *Service) GetOrCreate(ctx context.Context, me, other uuid.UUID) (*models.Conversation, error) {
	var count int64
	if err := s.repo.db.WithContext(ctx).Model(&models.User{}).Where("id = ?", other).Count(&count).Error; err != nil || count == 0 {
		return nil, response.NewError(404, "NOT_FOUND", "User tujuan tidak ditemukan")
	}
	return s.repo.GetOrCreate(ctx, me, other)
}

func (s *Service) List(ctx context.Context, userID uuid.UUID) ([]convRow, error) {
	return s.repo.ListForUser(ctx, userID)
}

func (s *Service) Messages(ctx context.Context, convID, userID uuid.UUID, limit int) ([]models.Message, error) {
	ok, err := s.repo.IsParticipant(ctx, convID, userID)
	if err != nil {
		return nil, response.ErrInternal
	}
	if !ok {
		return nil, response.ErrNotFound
	}
	_ = s.repo.MarkRead(ctx, convID, userID)
	return s.repo.Messages(ctx, convID, limit)
}

func (s *Service) Send(ctx context.Context, convID, senderID uuid.UUID, body string) (*models.Message, error) {
	ok, err := s.repo.IsParticipant(ctx, convID, senderID)
	if err != nil {
		return nil, response.ErrInternal
	}
	if !ok {
		return nil, response.ErrNotFound
	}
	body = strings.TrimSpace(body)
	if body == "" || len(body) > 2000 {
		return nil, response.ErrValidation([]response.ErrorDetail{{Field: "body", Message: "1-2000 karakter"}})
	}
	m := &models.Message{ConversationID: convID, SenderID: senderID, Body: body}
	if err := s.repo.SendMessage(ctx, m); err != nil {
		return nil, response.ErrInternal
	}
	return m, nil
}

func (s *Service) TotalUnread(ctx context.Context, userID uuid.UUID) (int64, error) {
	return s.repo.TotalUnread(ctx, userID)
}

type Handler struct{ svc *Service }

func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

// Start: POST /chat/start {with_user_id} → conversation (get-or-create)
func (h *Handler) Start(c *gin.Context) {
	var in struct {
		WithUserID string `json:"with_user_id"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		response.Fail(c, response.ErrBadRequest("Invalid request body"))
		return
	}
	other, err := uuid.Parse(strings.TrimSpace(in.WithUserID))
	if err != nil {
		response.Fail(c, response.ErrValidation([]response.ErrorDetail{{Field: "with_user_id", Message: "invalid uuid"}}))
		return
	}
	conv, err := h.svc.GetOrCreate(c.Request.Context(), middleware.CurrentUser(c).ID, other)
	if err != nil {
		response.Fail(c, err)
		return
	}
	response.OK(c, conv, "OK")
}

// List: GET /chat/conversations
func (h *Handler) List(c *gin.Context) {
	items, err := h.svc.List(c.Request.Context(), middleware.CurrentUser(c).ID)
	if err != nil {
		response.Fail(c, response.ErrInternal)
		return
	}
	response.OK(c, gin.H{"items": items}, "OK")
}

// Unread: GET /chat/unread → badge header
func (h *Handler) Unread(c *gin.Context) {
	n, err := h.svc.TotalUnread(c.Request.Context(), middleware.CurrentUser(c).ID)
	if err != nil {
		response.Fail(c, response.ErrInternal)
		return
	}
	response.OK(c, gin.H{"unread": n}, "OK")
}

// Messages: GET /chat/conversations/:id/messages
func (h *Handler) Messages(c *gin.Context) {
	convID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Fail(c, response.NewError(http.StatusBadRequest, "BAD_REQUEST", "Invalid conversation id"))
		return
	}
	limit := c.DefaultQuery("limit", "100")
	n := 100
	if limit == "50" {
		n = 50
	}
	msgs, err := h.svc.Messages(c.Request.Context(), convID, middleware.CurrentUser(c).ID, n)
	if err != nil {
		response.Fail(c, err)
		return
	}
	response.OK(c, gin.H{"items": msgs}, "OK")
}

// Send: POST /chat/conversations/:id/messages {body}
func (h *Handler) Send(c *gin.Context) {
	convID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Fail(c, response.NewError(http.StatusBadRequest, "BAD_REQUEST", "Invalid conversation id"))
		return
	}
	var in struct {
		Body string `json:"body"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		response.Fail(c, response.ErrBadRequest("Invalid request body"))
		return
	}
	m, err := h.svc.Send(c.Request.Context(), convID, middleware.CurrentUser(c).ID, in.Body)
	if err != nil {
		response.Fail(c, err)
		return
	}
	response.Created(c, m, "Pesan terkirim")
}
