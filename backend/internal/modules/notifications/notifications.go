package notifications

import (
	"context"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	gorm_logger "gorm.io/gorm/logger"
	"gorm.io/gorm"

	"kostify/backend/internal/http/middleware"
	"kostify/backend/internal/http/response"
	"kostify/backend/internal/models"
)

// Notifier is injected into other services so they can create notifications
// without depending on this package's internals.
type Notifier func(ctx context.Context, userID uuid.UUID, title, body, link string)

// NewNotifier returns a Notifier backed by db. Notification failures are
// logged-and-swallowed: a failed notification must never fail the main flow.
func NewNotifier(db *gorm.DB) Notifier {
	return func(ctx context.Context, userID uuid.UUID, title, body, link string) {
		if userID == uuid.Nil {
			return
		}
		n := &models.Notification{UserID: userID, Title: title, Body: body, Link: link}
		if err := db.WithContext(ctx).Create(n).Error; err != nil {
			gorm_logger.Default.Error(context.Background(), "notification create failed: %v", err)
		}
	}
}

type Handler struct {
	db *gorm.DB
}

func NewHandler(db *gorm.DB) *Handler { return &Handler{db: db} }

// GET /notifications
func (h *Handler) List(c *gin.Context) {
	userID := middleware.CurrentUser(c).ID
	limit, _ := strconv.Atoi(c.Query("limit"))
	if limit < 1 || limit > 50 {
		limit = 20
	}
	var items []models.Notification
	var unread int64
	if err := h.db.WithContext(c).Where("user_id = ?", userID).
		Order("created_at DESC").Limit(limit).Find(&items).Error; err != nil {
		response.Fail(c, response.ErrInternal)
		return
	}
	h.db.WithContext(c).Model(&models.Notification{}).Where("user_id = ? AND is_read = false", userID).Count(&unread)
	response.OK(c, gin.H{"items": items, "unread": unread}, "OK")
}

// PATCH /notifications/:id/read — id "all" marks every notification read.
func (h *Handler) MarkRead(c *gin.Context) {
	userID := middleware.CurrentUser(c).ID
	if c.Param("id") == "all" {
		if err := h.db.WithContext(c).Model(&models.Notification{}).
			Where("user_id = ? AND is_read = false", userID).Update("is_read", true).Error; err != nil {
			response.Fail(c, response.ErrInternal)
			return
		}
		response.OK(c, gin.H{"ok": true}, "All marked read")
		return
	}
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Fail(c, response.NewError(http.StatusBadRequest, "BAD_REQUEST", "Invalid id"))
		return
	}
	res := h.db.WithContext(c).Model(&models.Notification{}).
		Where("id = ? AND user_id = ?", id, userID).Update("is_read", true)
	if res.Error != nil {
		response.Fail(c, response.ErrInternal)
		return
	}
	if res.RowsAffected == 0 {
		response.Fail(c, response.ErrNotFound)
		return
	}
	response.OK(c, gin.H{"ok": true}, "Marked read")
}
