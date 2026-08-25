package auth

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"kostify/backend/internal/models"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository { return &Repository{db: db} }

func (r *Repository) CreateUser(ctx context.Context, u *models.User) error {
	return r.db.WithContext(ctx).Create(u).Error
}

func (r *Repository) GetUserByEmail(ctx context.Context, email string) (*models.User, error) {
	var u models.User
	if err := r.db.WithContext(ctx).First(&u, "email = ?", email).Error; err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *Repository) GetUserByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	var u models.User
	if err := r.db.WithContext(ctx).First(&u, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *Repository) CreateSession(ctx context.Context, s *models.Session) error {
	return r.db.WithContext(ctx).Create(s).Error
}

func (r *Repository) GetSessionByHash(ctx context.Context, hash string) (*models.Session, error) {
	var s models.Session
	if err := r.db.WithContext(ctx).First(&s, "refresh_token_hash = ?", hash).Error; err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *Repository) RevokeSession(ctx context.Context, id uuid.UUID) error {
	now := gorm.Expr("now()")
	return r.db.WithContext(ctx).Model(&models.Session{}).
		Where("id = ? AND revoked_at IS NULL", id).
		Update("revoked_at", now).Error
}

func (r *Repository) RevokeAllForUser(ctx context.Context, userID uuid.UUID) error {
	return r.db.WithContext(ctx).Model(&models.Session{}).
		Where("user_id = ? AND revoked_at IS NULL", userID).
		Update("revoked_at", gorm.Expr("now()")).Error
}
