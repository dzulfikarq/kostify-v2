package survey

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

func (r *Repository) ListAssignments(ctx context.Context, teknisiID *uuid.UUID) ([]models.KostAssignment, error) {
	var items []models.KostAssignment
	db := r.db.WithContext(ctx).Preload("Kost").Preload("Teknisi")
	if teknisiID != nil {
		db = db.Where("teknisi_id = ?", *teknisiID)
	}
	err := db.Order("created_at DESC").Find(&items).Error
	return items, err
}

func (r *Repository) GetAssignment(ctx context.Context, id uuid.UUID) (*models.KostAssignment, error) {
	var a models.KostAssignment
	if err := r.db.WithContext(ctx).Preload("Kost").Preload("Teknisi").First(&a, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *Repository) CreateAssignment(ctx context.Context, a *models.KostAssignment) error {
	return r.db.WithContext(ctx).Create(a).Error
}

func (r *Repository) UpdateAssignment(ctx context.Context, a *models.KostAssignment) error {
	return r.db.WithContext(ctx).Save(a).Error
}

func (r *Repository) ListEvents(ctx context.Context, filter func(*gorm.DB) *gorm.DB) ([]models.Event, error) {
	var items []models.Event
	db := r.db.WithContext(ctx).Preload("Kost").Preload("Teknisi").Preload("Owner")
	if filter != nil {
		db = filter(db)
	}
	err := db.Order("scheduled_at ASC").Find(&items).Error
	return items, err
}

func (r *Repository) CreateEvent(ctx context.Context, e *models.Event) error {
	return r.db.WithContext(ctx).Create(e).Error
}

func (r *Repository) GetEvent(ctx context.Context, id uuid.UUID) (*models.Event, error) {
	var e models.Event
	if err := r.db.WithContext(ctx).First(&e, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &e, nil
}

func (r *Repository) DeleteEvent(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.Event{}, "id = ?", id).Error
}

type Service struct {
	repo *Repository
	notify func(context.Context, uuid.UUID, string, string, string)
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo, notify: func(context.Context, uuid.UUID, string, string, string) {}}
}

func (s *Service) WithNotifier(n func(context.Context, uuid.UUID, string, string, string)) *Service {
	s.notify = n
	return s
}

// AssignTech assigns a teknisi to a kost (admin only).
func (s *Service) AssignTech(ctx context.Context, adminID, kostID, teknisiID uuid.UUID, scheduledAt *time.Time) (*models.KostAssignment, error) {
	// teknisi harus benar role teknisi
	var u models.User
	if err := s.repo.db.WithContext(ctx).First(&u, "id = ? AND role = ?", teknisiID, models.RoleTeknisi).Error; err != nil {
		return nil, response.NewError(400, "BAD_REQUEST", "User bukan teknisi")
	}
	a := &models.KostAssignment{
		KostID:     kostID,
		TeknisiID:  teknisiID,
		Status:     models.AssignmentAssigned,
		AssignedBy: &adminID,
	}
	if err := s.repo.CreateAssignment(ctx, a); err != nil {
		return nil, response.ErrInternal
	}
	s.notify(ctx, teknisiID, "Tugas survey baru", "Anda ditugaskan survey kost. Cek dashboard teknisi.", "/dashboard/teknisi")
	return a, nil
}

// ListAssignments: teknisi → miliknya; admin → semua.
func (s *Service) ListAssignments(ctx context.Context, teknisiID *uuid.UUID) ([]models.KostAssignment, error) {
	return s.repo.ListAssignments(ctx, teknisiID)
}

// Decide: teknisi memutuskan hasil survey → update kost status.
func (s *Service) Decide(ctx context.Context, assignmentID, teknisiID uuid.UUID, decision, note string) (*models.KostAssignment, error) {
	a, err := s.repo.GetAssignment(ctx, assignmentID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, response.ErrNotFound
		}
		return nil, response.ErrInternal
	}
	if a.TeknisiID != teknisiID {
		return nil, response.ErrNotFound
	}
	if a.DecidedAt != nil {
		return nil, response.ErrConflict("Sudah diputus sebelumnya")
	}
	if decision != "approved" && decision != "rejected" {
		return nil, response.ErrValidation([]response.ErrorDetail{{Field: "decision", Message: "must be approved or rejected"}})
	}
	if len(strings.TrimSpace(note)) < 5 {
		return nil, response.ErrValidation([]response.ErrorDetail{{Field: "note", Message: "catatan hasil survey minimal 5 karakter"}})
	}

	now := time.Now()
	dec := decision
	a.Status = models.AssignmentStatus(dec)
	a.Decision = &dec
	a.Note = &note
	a.DecidedAt = &now

	err = s.repo.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(a).Error; err != nil {
			return err
		}
		// Terapkan keputusan ke status kost.
		kostStatus := models.KostVerified
		if decision == "rejected" {
			kostStatus = models.KostRejected
		}
		updates := map[string]any{"status": kostStatus, "updated_at": now}
		if decision == "approved" {
			updates["verified_at"] = now
			updates["rejection_note"] = nil
		} else {
			updates["rejection_note"] = note
		}
		return tx.Model(&models.Kost{}).Where("id = ?", a.KostID).Updates(updates).Error
	})
	if err != nil {
		return nil, response.ErrInternal
	}
	return a, nil
}

// ListEvents role-scoped: admin semua, teknisi miliknya, owner kost miliknya.
func (s *Service) ListEvents(ctx context.Context, role string, userID uuid.UUID) ([]models.Event, error) {
	var filter func(*gorm.DB) *gorm.DB
	switch role {
	case string(models.RoleSuperAdmin):
		// semua
	case string(models.RoleTeknisi):
		filter = func(db *gorm.DB) *gorm.DB { return db.Where("teknisi_id = ?", userID) }
	case string(models.RoleOwner):
		filter = func(db *gorm.DB) *gorm.DB { return db.Where("owner_id = ?", userID) }
	default:
		filter = func(db *gorm.DB) *gorm.DB { return db.Where("owner_id = ? OR teknisi_id = ?", userID, userID) }
	}
	return s.repo.ListEvents(ctx, filter)
}

// CreateEvent: admin only (jadwal survey kost).
func (s *Service) CreateEvent(ctx context.Context, adminID uuid.UUID, in EventInput) (*models.Event, error) {
	scheduledAt, err := time.Parse(time.RFC3339, in.ScheduledAt)
	if err != nil {
		return nil, response.ErrValidation([]response.ErrorDetail{{Field: "scheduled_at", Message: "must be RFC3339 datetime"}})
	}
	e := &models.Event{
		Title:       strings.TrimSpace(in.Title),
		EventType:   "survey",
		ScheduledAt: scheduledAt,
		Notes:       in.Notes,
		CreatedBy:   &adminID,
	}
	if in.KostID != "" {
		kid, err := uuid.Parse(in.KostID)
		if err != nil {
			return nil, response.ErrValidation([]response.ErrorDetail{{Field: "kost_id", Message: "invalid uuid"}})
		}
		e.KostID = &kid
		var kost models.Kost
		if err := s.repo.db.WithContext(ctx).First(&kost, "id = ?", kid).Error; err == nil {
			e.OwnerID = &kost.OwnerID
		}
	}
	if in.TeknisiID != "" {
		tid, err := uuid.Parse(in.TeknisiID)
		if err != nil {
			return nil, response.ErrValidation([]response.ErrorDetail{{Field: "teknisi_id", Message: "invalid uuid"}})
		}
		e.TeknisiID = &tid
	}
	if e.Title == "" {
		return nil, response.ErrValidation([]response.ErrorDetail{{Field: "title", Message: "title is required"}})
	}
	if err := s.repo.CreateEvent(ctx, e); err != nil {
		return nil, response.ErrInternal
	}
	if e.TeknisiID != nil {
		s.notify(ctx, *e.TeknisiID, "Jadwal survey baru", e.Title+" — "+scheduledAt.Format("02 Jan 2006 15:04"), "/dashboard/events")
	}
	if e.OwnerID != nil {
		s.notify(ctx, *e.OwnerID, "Jadwal survey kost", "Tim kami akan survey kost Anda pada "+scheduledAt.Format("02 Jan 2006 15:04"), "/dashboard/events")
	}
	return e, nil
}

func (s *Service) DeleteEvent(ctx context.Context, id uuid.UUID) error {
	if _, err := s.repo.GetEvent(ctx, id); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return response.ErrNotFound
		}
		return response.ErrInternal
	}
	return s.repo.DeleteEvent(ctx, id)
}

type EventInput struct {
	Title       string `json:"title"`
	KostID      string `json:"kost_id"`
	TeknisiID   string `json:"teknisi_id"`
	ScheduledAt string `json:"scheduled_at"`
	Notes       string `json:"notes"`
}

func (in EventInput) Validate() []response.ErrorDetail {
	var errs []response.ErrorDetail
	if strings.TrimSpace(in.Title) == "" {
		errs = append(errs, response.ErrorDetail{Field: "title", Message: "title is required"})
	}
	if _, err := time.Parse(time.RFC3339, in.ScheduledAt); err != nil {
		errs = append(errs, response.ErrorDetail{Field: "scheduled_at", Message: "must be RFC3339 datetime"})
	}
	return errs
}

type Handler struct{ svc *Service }

func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

// AssignTech: POST /admin/kosts/:id/assign {teknisi_id, scheduled_at?}
func (h *Handler) AssignTech(c *gin.Context) {
	kostID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Fail(c, response.NewError(http.StatusBadRequest, "BAD_REQUEST", "Invalid kost id"))
		return
	}
	var in struct {
		TeknisiID   string `json:"teknisi_id"`
		ScheduledAt string `json:"scheduled_at"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		response.Fail(c, response.ErrBadRequest("Invalid request body"))
		return
	}
	tid, err := uuid.Parse(strings.TrimSpace(in.TeknisiID))
	if err != nil {
		response.Fail(c, response.ErrValidation([]response.ErrorDetail{{Field: "teknisi_id", Message: "invalid uuid"}}))
		return
	}
	var scheduledAt *time.Time
	if in.ScheduledAt != "" {
		if t, err := time.Parse(time.RFC3339, in.ScheduledAt); err == nil {
			scheduledAt = &t
		}
	}
	a, err := h.svc.AssignTech(c.Request.Context(), middleware.CurrentUser(c).ID, kostID, tid, scheduledAt)
	if err != nil {
		response.Fail(c, err)
		return
	}
	// Optional: sekalian buat jadwal event survey.
	if scheduledAt != nil {
		kostIDStr := kostID
		_, _ = h.svc.CreateEvent(c.Request.Context(), middleware.CurrentUser(c).ID, EventInput{
			Title:       "Survey kost (assignment)",
			KostID:      kostIDStr.String(),
			TeknisiID:   tid.String(),
			ScheduledAt: in.ScheduledAt,
			Notes:       "Dibuat otomatis saat assignment teknisi",
		})
	}
	response.Created(c, a, "Teknisi ditugaskan")
}

// ListAssignments: GET /teknisi/assignments (teknisi) atau /admin/assignments (admin)
func (h *Handler) ListAssignments(c *gin.Context) {
	u := middleware.CurrentUser(c)
	var teknisiID *uuid.UUID
	if u.Role == models.RoleTeknisi {
		teknisiID = &u.ID
	}
	items, err := h.svc.ListAssignments(c.Request.Context(), teknisiID)
	if err != nil {
		response.Fail(c, response.ErrInternal)
		return
	}
	response.OK(c, gin.H{"items": items}, "OK")
}

// Decide: PATCH /teknisi/assignments/:id/decide {decision, note}
func (h *Handler) Decide(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Fail(c, response.NewError(http.StatusBadRequest, "BAD_REQUEST", "Invalid assignment id"))
		return
	}
	var in struct {
		Decision string `json:"decision"`
		Note     string `json:"note"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		response.Fail(c, response.ErrBadRequest("Invalid request body"))
		return
	}
	a, err := h.svc.Decide(c.Request.Context(), id, middleware.CurrentUser(c).ID, in.Decision, in.Note)
	if err != nil {
		response.Fail(c, err)
		return
	}
	response.OK(c, a, "Keputusan survey tersimpan")
}

// ListEvents: GET /events (role-scoped, readonly untuk non-admin)
func (h *Handler) ListEvents(c *gin.Context) {
	u := middleware.CurrentUser(c)
	items, err := h.svc.ListEvents(c.Request.Context(), string(u.Role), u.ID)
	if err != nil {
		response.Fail(c, response.ErrInternal)
		return
	}
	response.OK(c, gin.H{"items": items}, "OK")
}

// CreateEvent: POST /admin/events
func (h *Handler) CreateEvent(c *gin.Context) {
	var in EventInput
	if err := c.ShouldBindJSON(&in); err != nil {
		response.Fail(c, response.ErrBadRequest("Invalid request body"))
		return
	}
	if errs := in.Validate(); len(errs) > 0 {
		response.Fail(c, response.ErrValidation(errs))
		return
	}
	e, err := h.svc.CreateEvent(c.Request.Context(), middleware.CurrentUser(c).ID, in)
	if err != nil {
		response.Fail(c, err)
		return
	}
	response.Created(c, e, "Jadwal survey dibuat")
}

// DeleteEvent: DELETE /admin/events/:id
func (h *Handler) DeleteEvent(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Fail(c, response.NewError(http.StatusBadRequest, "BAD_REQUEST", "Invalid event id"))
		return
	}
	if err := h.svc.DeleteEvent(c.Request.Context(), id); err != nil {
		response.Fail(c, err)
		return
	}
	response.NoContent(c)
}
