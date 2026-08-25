package kosts

import (
	"context"
	"strings"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"kostify/backend/internal/models"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository { return &Repository{db: db} }

// Kost

func (r *Repository) CreateKost(ctx context.Context, k *models.Kost) error {
	return r.db.WithContext(ctx).Create(k).Error
}

func (r *Repository) GetKostByID(ctx context.Context, id uuid.UUID) (*models.Kost, error) {
	var k models.Kost
	if err := r.db.WithContext(ctx).Preload("Owner").First(&k, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &k, nil
}

func (r *Repository) UpdateKost(ctx context.Context, k *models.Kost) error {
	return r.db.WithContext(ctx).Save(k).Error
}

func (r *Repository) DeleteKost(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.Kost{}, "id = ?", id).Error
}

func (r *Repository) ListKosts(ctx context.Context, q ListQuery, ownerID *uuid.UUID, verifiedOnly bool) ([]models.Kost, int64, error) {
	db := r.db.WithContext(ctx).Model(&models.Kost{})

	if verifiedOnly {
		db = db.Where("kosts.status = ?", models.KostVerified)
	} else if q.Status != "" {
		db = db.Where("kosts.status = ?", q.Status)
	}
	if ownerID != nil {
		db = db.Where("kosts.owner_id = ?", *ownerID)
	}
	if q.City != "" {
		db = db.Where("kosts.city ILIKE ?", "%"+q.City+"%")
	}
	if q.Gender != "" {
		db = db.Where("kosts.gender = ?", q.Gender)
	}
	if q.Search != "" {
		like := "%" + q.Search + "%"
		db = db.Where("(kosts.name ILIKE ? OR kosts.city ILIKE ? OR kosts.address ILIKE ?)", like, like, like)
	}
	for _, fac := range q.Facilities {
		db = db.Where("? = ANY(kosts.facilities)", fac)
	}
	if q.MinPrice != nil || q.MaxPrice != nil {
		sub := r.db.WithContext(ctx).Model(&models.Room{}).Select("1").Where("rooms.kost_id = kosts.id")
		if q.MinPrice != nil {
			sub = sub.Where("rooms.price_monthly >= ?", *q.MinPrice)
		}
		if q.MaxPrice != nil {
			sub = sub.Where("rooms.price_monthly <= ?", *q.MaxPrice)
		}
		db = db.Where("EXISTS (?)", sub)
	}

	allowedSort := map[string]bool{"created_at": true, "name": true, "city": true, "updated_at": true}
	sortCol := "kosts.created_at"
	if allowedSort[q.Sort] {
		sortCol = "kosts." + q.Sort
	}
	order := "DESC"
	if strings.ToLower(q.Order) == "asc" {
		order = "ASC"
	}

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var kosts []models.Kost
	if err := db.Preload("Owner").Order(sortCol+" "+order).
		Offset((q.Page-1)*q.Limit).Limit(q.Limit).
		Find(&kosts).Error; err != nil {
		return nil, 0, err
	}
	return kosts, total, nil
}

// Room

func (r *Repository) CreateRoom(ctx context.Context, rm *models.Room) error {
	return r.db.WithContext(ctx).Create(rm).Error
}

func (r *Repository) GetRoomByID(ctx context.Context, id uuid.UUID) (*models.Room, error) {
	var rm models.Room
	if err := r.db.WithContext(ctx).First(&rm, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &rm, nil
}

func (r *Repository) ListRoomsByKost(ctx context.Context, kostID uuid.UUID) ([]models.Room, error) {
	var rooms []models.Room
	if err := r.db.WithContext(ctx).Where("kost_id = ?", kostID).Order("room_number ASC").Find(&rooms).Error; err != nil {
		return nil, err
	}
	return rooms, nil
}

func (r *Repository) UpdateRoom(ctx context.Context, rm *models.Room) error {
	return r.db.WithContext(ctx).Save(rm).Error
}

func (r *Repository) DeleteRoom(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.Room{}, "id = ?", id).Error
}

func (r *Repository) CountActiveContractsForRoom(ctx context.Context, roomID uuid.UUID) (int64, error) {
	var cnt int64
	if err := r.db.WithContext(ctx).Table("contracts").Where("room_id = ? AND status = ?", roomID, "active").Count(&cnt).Error; err != nil {
		return 0, err
	}
	return cnt, nil
}
