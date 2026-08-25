package auth

import (
	"context"
	"errors"
	"log/slog"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"kostify/backend/internal/config"
	"kostify/backend/internal/http/response"
	"kostify/backend/internal/models"
)

type Service struct {
	repo *Repository
	cfg  *config.Config
}

func NewService(repo *Repository, cfg *config.Config) *Service {
	return &Service{repo: repo, cfg: cfg}
}

func (s *Service) Register(ctx context.Context, in RegisterInput) (*models.User, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(in.Password), 12)
	if err != nil {
		return nil, response.ErrInternal
	}
	u := &models.User{
		Name:         strings.TrimSpace(in.Name),
		Email:        strings.ToLower(strings.TrimSpace(in.Email)),
		Phone:        strings.TrimSpace(in.Phone),
		PasswordHash: string(hash),
		Role:         models.UserRole(in.Role),
		IsActive:     true,
	}
	if err := s.repo.CreateUser(ctx, u); err != nil {
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			return nil, response.ErrConflict("Email already registered")
		}
		// Postgres unique violation fallback text.
		if strings.Contains(err.Error(), "duplicate key") {
			return nil, response.ErrConflict("Email already registered")
		}
		return nil, response.ErrInternal
	}
	return u, nil
}

func (s *Service) Login(ctx context.Context, email, password string) (*models.User, string, string, string, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	u, err := s.repo.GetUserByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, "", "", "", response.NewError(401, "UNAUTHORIZED", "Invalid email or password")
		}
		return nil, "", "", "", response.ErrInternal
	}
	if !u.IsActive {
		return nil, "", "", "", response.NewError(403, "FORBIDDEN", "Account is disabled")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password)); err != nil {
		return nil, "", "", "", response.NewError(401, "UNAUTHORIZED", "Invalid email or password")
	}

	access, err := s.signAccessToken(u)
	if err != nil {
		return nil, "", "", "", response.ErrInternal
	}
	refreshRaw, err := randomHex(32)
	if err != nil {
		return nil, "", "", "", response.ErrInternal
	}
	csrfRaw, err := randomHex(16)
	if err != nil {
		return nil, "", "", "", response.ErrInternal
	}

	sess := &models.Session{
		UserID:           u.ID,
		RefreshTokenHash: hashToken(refreshRaw),
		ExpiresAt:        time.Now().Add(s.cfg.RefreshTokenTTL),
	}
	if err := s.repo.CreateSession(ctx, sess); err != nil {
		return nil, "", "", "", response.ErrInternal
	}
	return u, access, refreshRaw, csrfRaw, nil
}

func (s *Service) Refresh(ctx context.Context, rawRefresh string) (*models.User, string, string, string, error) {
	hash := hashToken(rawRefresh)
	sess, err := s.repo.GetSessionByHash(ctx, hash)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, "", "", "", response.ErrUnauthorized
		}
		return nil, "", "", "", response.ErrInternal
	}
	// Reuse detection: already revoked → theft.
	if sess.RevokedAt != nil {
		_ = s.repo.RevokeAllForUser(ctx, sess.UserID)
		slog.Warn("refresh reuse detected", "user_id", sess.UserID)
		return nil, "", "", "", response.ErrUnauthorized
	}
	if sess.ExpiresAt.Before(time.Now()) {
		_ = s.repo.RevokeSession(ctx, sess.ID)
		return nil, "", "", "", response.NewError(401, "UNAUTHORIZED", "Session expired")
	}

	u, err := s.repo.GetUserByID(ctx, sess.UserID)
	if err != nil {
		return nil, "", "", "", response.ErrUnauthorized
	}
	if !u.IsActive {
		return nil, "", "", "", response.NewError(403, "FORBIDDEN", "Account is disabled")
	}

	// Rotate: revoke old, create new.
	if err := s.repo.RevokeSession(ctx, sess.ID); err != nil {
		return nil, "", "", "", response.ErrInternal
	}
	access, err := s.signAccessToken(u)
	if err != nil {
		return nil, "", "", "", response.ErrInternal
	}
	newRefreshRaw, err := randomHex(32)
	if err != nil {
		return nil, "", "", "", response.ErrInternal
	}
	csrfRaw, err := randomHex(16)
	if err != nil {
		return nil, "", "", "", response.ErrInternal
	}
	newSess := &models.Session{
		UserID:           u.ID,
		RefreshTokenHash: hashToken(newRefreshRaw),
		ExpiresAt:        time.Now().Add(s.cfg.RefreshTokenTTL),
	}
	if err := s.repo.CreateSession(ctx, newSess); err != nil {
		return nil, "", "", "", response.ErrInternal
	}
	return u, access, newRefreshRaw, csrfRaw, nil
}

func (s *Service) Logout(ctx context.Context, rawRefresh string) error {
	if rawRefresh == "" {
		return nil
	}
	hash := hashToken(rawRefresh)
	sess, err := s.repo.GetSessionByHash(ctx, hash)
	if err != nil {
		return nil
	}
	if sess.RevokedAt != nil {
		return nil
	}
	return s.repo.RevokeSession(ctx, sess.ID)
}

func (s *Service) EnsureSuperAdmin(ctx context.Context) error {
	var existing models.User
	err := s.repo.db.WithContext(ctx).First(&existing, "email = ?", strings.ToLower(s.cfg.AdminEmail)).Error
	if err == nil {
		// Ensure role is super_admin.
		if existing.Role != models.RoleSuperAdmin {
			return s.repo.db.WithContext(ctx).Model(&existing).Update("role", models.RoleSuperAdmin).Error
		}
		return nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(s.cfg.AdminPassword), 12)
	if err != nil {
		return err
	}
	u := &models.User{
		Name:         "Super Admin",
		Email:        strings.ToLower(s.cfg.AdminEmail),
		PasswordHash: string(hash),
		Role:         models.RoleSuperAdmin,
		IsActive:     true,
	}
	if err := s.repo.db.WithContext(ctx).Create(u).Error; err != nil {
		return err
	}
	slog.Info("super admin seeded", "email", u.Email)
	return nil
}

func (s *Service) signAccessToken(u *models.User) (string, error) {
	now := time.Now()
	claims := jwt.MapClaims{
		"sub":  u.ID.String(),
		"role": string(u.Role),
		"iat":  now.Unix(),
		"exp":  now.Add(s.cfg.AccessTokenTTL).Unix(),
		"jti":  uuid.NewString(),
		"typ":  "access",
	}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	secret := s.cfg.JWTAccessSecret
	if secret == "" {
		secret = "dev-access-secret-change-in-production-0123456789"
	}
	return t.SignedString([]byte(secret))
}
