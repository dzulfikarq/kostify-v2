package users

import (
	"context"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"kostify/backend/internal/http/response"
	"kostify/backend/internal/models"
)

type ListQuery struct {
	Page   int
	Limit  int
	Search string
	Role   string
}

func (q ListQuery) Validate() []response.ErrorDetail { return nil }

type UpdateInput struct {
	IsActive *bool   `json:"is_active"`
	Role     *string `json:"role"`
}

func (in UpdateInput) Validate() []response.ErrorDetail {
	var errs []response.ErrorDetail
	if in.Role != nil && *in.Role != string(models.RoleOwner) && *in.Role != string(models.RoleTenant) && *in.Role != string(models.RoleSuperAdmin) {
		errs = append(errs, response.ErrorDetail{Field: "role", Message: "must be owner, tenant or super_admin"})
	}
	return errs
}

type CreateInput struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Role     string `json:"role"`
	Phone    string `json:"phone"`
	IsActive *bool  `json:"is_active"`
}

func (in CreateInput) Validate() []response.ErrorDetail {
	var errs []response.ErrorDetail
	if l := len(strings.TrimSpace(in.Name)); l < 2 || l > 120 {
		errs = append(errs, response.ErrorDetail{Field: "name", Message: "must be 2-120 characters"})
	}
	if !strings.Contains(in.Email, "@") || len(in.Email) < 5 {
		errs = append(errs, response.ErrorDetail{Field: "email", Message: "must be a valid email"})
	}
	if len(in.Password) < 8 || len(in.Password) > 72 {
		errs = append(errs, response.ErrorDetail{Field: "password", Message: "must be 8-72 characters"})
	}
	if in.Role != "" && in.Role != string(models.RoleOwner) && in.Role != string(models.RoleTenant) && in.Role != string(models.RoleSuperAdmin) {
		errs = append(errs, response.ErrorDetail{Field: "role", Message: "must be owner, tenant or super_admin"})
	}
	return errs
}

type Repository struct{ db *gorm.DB }

func NewRepository(db *gorm.DB) *Repository { return &Repository{db: db} }

func (r *Repository) List(ctx context.Context, q ListQuery) ([]models.User, int64, error) {
	db := r.db.WithContext(ctx).Model(&models.User{})
	if strings.TrimSpace(q.Search) != "" {
		like := "%" + strings.TrimSpace(q.Search) + "%"
		db = db.Where("name ILIKE ? OR email ILIKE ?", like, like)
	}
	if q.Role != "" {
		db = db.Where("role = ?", q.Role)
	}
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var users []models.User
	if err := db.Order("created_at DESC").Offset((q.Page-1)*q.Limit).Limit(q.Limit).Find(&users).Error; err != nil {
		return nil, 0, err
	}
	return users, total, nil
}

func (r *Repository) GetByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	var u models.User
	if err := r.db.WithContext(ctx).First(&u, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *Repository) Update(ctx context.Context, u *models.User) error {
	return r.db.WithContext(ctx).Save(u).Error
}

func (r *Repository) Create(ctx context.Context, u *models.User) error {
	return r.db.WithContext(ctx).Create(u).Error
}

func (r *Repository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.User{}, "id = ?", id).Error
}

type Service struct{ repo *Repository }

func NewService(repo *Repository) *Service { return &Service{repo: repo} }

func (s *Service) List(ctx context.Context, q ListQuery) ([]models.User, int64, error) {
	return s.repo.List(ctx, q)
}
func (s *Service) Update(ctx context.Context, id uuid.UUID, in UpdateInput) (*models.User, error) {
	u, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if in.IsActive != nil {
		u.IsActive = *in.IsActive
	}
	if in.Role != nil {
		u.Role = models.UserRole(*in.Role)
	}
	if err := s.repo.Update(ctx, u); err != nil {
		return nil, err
	}
	return u, nil
}

func (s *Service) Create(ctx context.Context, in CreateInput) (*models.User, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(in.Password), 12)
	if err != nil {
		return nil, response.ErrInternal
	}
	role := models.RoleTenant
	if in.Role != "" {
		role = models.UserRole(in.Role)
	}
	isActive := true
	if in.IsActive != nil {
		isActive = *in.IsActive
	}
	u := &models.User{
		Name:         strings.TrimSpace(in.Name),
		Email:        strings.ToLower(strings.TrimSpace(in.Email)),
		Phone:        strings.TrimSpace(in.Phone),
		PasswordHash: string(hash),
		Role:         role,
		IsActive:     isActive,
	}
	if err := s.repo.Create(ctx, u); err != nil {
		if errors.Is(err, gorm.ErrDuplicatedKey) || strings.Contains(err.Error(), "duplicate key") {
			return nil, response.ErrConflict("Email already registered")
		}
		return nil, response.ErrInternal
	}
	return u, nil
}

func (s *Service) Delete(ctx context.Context, id uuid.UUID) error {
	if _, err := s.repo.GetByID(ctx, id); err != nil {
		return err
	}
	return s.repo.Delete(ctx, id)
}

type Handler struct{ svc *Service }

func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

func (h *Handler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.Query("page"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(c.Query("limit"))
	if limit < 1 || limit > 100 {
		limit = 20
	}
	q := ListQuery{Page: page, Limit: limit, Search: strings.TrimSpace(c.Query("search")), Role: strings.TrimSpace(c.Query("role"))}
	users, total, err := h.svc.List(c.Request.Context(), q)
	if err != nil {
		response.Fail(c, response.ErrInternal)
		return
	}
	totalPages := int((total + int64(limit) - 1) / int64(limit))
	if totalPages < 1 {
		totalPages = 1
	}
	response.OK(c, gin.H{"items": users, "pagination": gin.H{"page": page, "limit": limit, "total": total, "total_pages": totalPages}}, "OK")
}

func (h *Handler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Fail(c, response.NewError(http.StatusBadRequest, "BAD_REQUEST", "Invalid user id"))
		return
	}
	var in UpdateInput
	if err := c.ShouldBindJSON(&in); err != nil {
		response.Fail(c, response.ErrBadRequest("Invalid request body"))
		return
	}
	if errs := in.Validate(); len(errs) > 0 {
		response.Fail(c, response.ErrValidation(errs))
		return
	}
	u, err := h.svc.Update(c.Request.Context(), id, in)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.Fail(c, response.ErrNotFound)
			return
		}
		response.Fail(c, response.ErrInternal)
		return
	}
	response.OK(c, u, "User updated")
}

func (h *Handler) Create(c *gin.Context) {
	var in CreateInput
	if err := c.ShouldBindJSON(&in); err != nil {
		response.Fail(c, response.ErrBadRequest("Invalid request body"))
		return
	}
	if errs := in.Validate(); len(errs) > 0 {
		response.Fail(c, response.ErrValidation(errs))
		return
	}
	u, err := h.svc.Create(c.Request.Context(), in)
	if err != nil {
		response.Fail(c, err)
		return
	}
	response.Created(c, u, "User created")
}

func (h *Handler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Fail(c, response.NewError(http.StatusBadRequest, "BAD_REQUEST", "Invalid user id"))
		return
	}
	if err := h.svc.Delete(c.Request.Context(), id); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.Fail(c, response.ErrNotFound)
			return
		}
		response.Fail(c, response.ErrInternal)
		return
	}
	response.NoContent(c)
}
