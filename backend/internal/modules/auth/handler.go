package auth

import (
	"strings"

	"github.com/gin-gonic/gin"

	"kostify/backend/internal/config"
	"kostify/backend/internal/http/middleware"
	"kostify/backend/internal/http/response"
	"kostify/backend/internal/models"
)

type Handler struct {
	svc *Service
	cfg *config.Config
}

func NewHandler(svc *Service, cfg *config.Config) *Handler {
	return &Handler{svc: svc, cfg: cfg}
}

func (h *Handler) Register(c *gin.Context) {
	var in RegisterInput
	if err := c.ShouldBindJSON(&in); err != nil {
		response.Fail(c, response.ErrBadRequest("Invalid request body"))
		return
	}
	if errs := in.Validate(); len(errs) > 0 {
		response.Fail(c, response.ErrValidation(errs))
		return
	}
	u, err := h.svc.Register(c.Request.Context(), in)
	if err != nil {
		response.Fail(c, err)
		return
	}
	response.Created(c, toUserJSON(u), "Registered successfully")
}

func (h *Handler) Login(c *gin.Context) {
	var in LoginInput
	if err := c.ShouldBindJSON(&in); err != nil {
		response.Fail(c, response.ErrBadRequest("Invalid request body"))
		return
	}
	in.Email = strings.ToLower(strings.TrimSpace(in.Email))
	if err := in.Validate(); err != nil {
		response.Fail(c, response.ErrBadRequest(err.Error()))
		return
	}
	u, access, refresh, csrf, err := h.svc.Login(c.Request.Context(), in.Email, in.Password)
	if err != nil {
		response.Fail(c, err)
		return
	}
	setAuthCookies(c, h.cfg, access, refresh, csrf)
	response.OK(c, toUserJSON(u), "Logged in")
}

func (h *Handler) Refresh(c *gin.Context) {
	raw, err := c.Cookie(CookieRefresh)
	if err != nil || raw == "" {
		response.Fail(c, response.ErrUnauthorized)
		return
	}
	u, access, refresh, csrf, err := h.svc.Refresh(c.Request.Context(), raw)
	if err != nil {
		clearAuthCookies(c, h.cfg)
		response.Fail(c, err)
		return
	}
	setAuthCookies(c, h.cfg, access, refresh, csrf)
	response.OK(c, toUserJSON(u), "Token refreshed")
}

func (h *Handler) Logout(c *gin.Context) {
	raw, _ := c.Cookie(CookieRefresh)
	_ = h.svc.Logout(c.Request.Context(), raw)
	clearAuthCookies(c, h.cfg)
	response.OK(c, nil, "Logged out")
}

func (h *Handler) Me(c *gin.Context) {
	u := middleware.CurrentUser(c)
	if u == nil {
		response.Fail(c, response.ErrUnauthorized)
		return
	}
	response.OK(c, toUserJSON(u), "OK")
}

func (h *Handler) CSRF(c *gin.Context) {
	csrf, err := randomHex(16)
	if err != nil {
		response.Fail(c, response.ErrInternal)
		return
	}
	setCSRFCookie(c, h.cfg, csrf)
	response.OK(c, gin.H{"csrf_token": csrf}, "OK")
}

func toUserJSON(u *models.User) gin.H {
	return gin.H{
		"id":         u.ID,
		"name":       u.Name,
		"email":      u.Email,
		"phone":      u.Phone,
		"role":       u.Role,
		"is_active":  u.IsActive,
		"created_at": u.CreatedAt,
		"updated_at": u.UpdatedAt,
	}
}
