package bookings

import (
	"context"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"kostify/backend/internal/config"
	"kostify/backend/internal/models"
)

type Repository struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewRepository(db *gorm.DB, cfg *config.Config) *Repository {
	return &Repository{db: db, cfg: cfg}
}

func (r *Repository) GetRoomLocked(ctx context.Context, tx *gorm.DB, roomID uuid.UUID) (*models.Room, error) {
	var room models.Room
	if err := tx.WithContext(ctx).Clauses(clause.Locking{Strength: "UPDATE"}).First(&room, "id = ?", roomID).Error; err != nil {
		return nil, err
	}
	return &room, nil
}

func (r *Repository) GetKostByID(ctx context.Context, tx *gorm.DB, kostID uuid.UUID) (*models.Kost, error) {
	var k models.Kost
	db := r.db
	if tx != nil {
		db = tx
	}
	if err := db.WithContext(ctx).First(&k, "id = ?", kostID).Error; err != nil {
		return nil, err
	}
	return &k, nil
}

// GetUserByID returns a user or nil (best-effort, used for display names).
func (r *Repository) GetUserByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	var u models.User
	if err := r.db.WithContext(ctx).First(&u, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *Repository) CreateBookingTx(ctx context.Context, tenantID, roomID uuid.UUID, surveyDate time.Time) (*models.Booking, error) {
	var booking *models.Booking
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		room, err := r.GetRoomLocked(ctx, tx, roomID)
		if err != nil {
			return err
		}
		if room.Status != models.RoomAvailable {
			return gorm.ErrDuplicatedKey // signal conflict (mapped to 409)
		}
		kost, err := r.GetKostByID(ctx, tx, room.KostID)
		if err != nil {
			return err
		}
		if kost.Status != models.KostVerified {
			return gorm.ErrRecordNotFound // treat as not found/bookable
		}

		expiresAt := time.Now().Add(time.Duration(r.cfg.BookingExpiryHours) * time.Hour)
		b := &models.Booking{
			RoomID:     roomID,
			TenantID:   tenantID,
			Status:     models.BookingPending,
			SurveyDate: &surveyDate,
			ExpiresAt:  expiresAt,
		}
		if err := tx.Create(b).Error; err != nil {
			return err
		}
		booking = b

		if err := tx.Model(&models.Room{}).Where("id = ? AND status = ?", roomID, models.RoomAvailable).
			Update("status", models.RoomReserved).Error; err != nil {
			return err
		}
		// If no rows affected, another txn raced.
		return nil
	})
	if err != nil {
		return nil, err
	}
	return booking, nil
}

func (r *Repository) GetBookingByID(ctx context.Context, id uuid.UUID) (*models.Booking, error) {
	var b models.Booking
	if err := r.db.WithContext(ctx).Preload("Room").Preload("Tenant").First(&b, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &b, nil
}

func (r *Repository) GetBookingWithKostOwner(ctx context.Context, id uuid.UUID) (*models.Booking, *models.Kost, error) {
	b, err := r.GetBookingByID(ctx, id)
	if err != nil {
		return nil, nil, err
	}
	kost, err := r.GetKostByID(ctx, nil, b.Room.KostID)
	if err != nil {
		return b, nil, err
	}
	return b, kost, nil
}

func (r *Repository) UpdateBooking(ctx context.Context, b *models.Booking) error {
	return r.db.WithContext(ctx).Save(b).Error
}

func (r *Repository) ListTenantBookings(ctx context.Context, tenantID uuid.UUID, page, limit int, status string) ([]models.Booking, int64, error) {
	q := r.db.WithContext(ctx).Model(&models.Booking{}).Where("tenant_id = ?", tenantID)
	if status != "" {
		q = q.Where("status = ?", status)
	}
	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var bookings []models.Booking
	if err := q.Preload("Room").Order("created_at DESC").Offset((page-1)*limit).Limit(limit).Find(&bookings).Error; err != nil {
		return nil, 0, err
	}
	return bookings, total, nil
}

func (r *Repository) ListOwnerBookings(ctx context.Context, ownerID uuid.UUID, page, limit int, status string) ([]models.Booking, int64, error) {
	q := r.db.WithContext(ctx).Model(&models.Booking{}).
		Joins("JOIN rooms ON rooms.id = bookings.room_id").
		Joins("JOIN kosts ON kosts.id = rooms.kost_id").
		Where("kosts.owner_id = ?", ownerID)
	if status != "" {
		q = q.Where("bookings.status = ?", status)
	}
	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var bookings []models.Booking
	if err := q.Preload("Room").Preload("Tenant").Order("bookings.created_at DESC").Offset((page-1)*limit).Limit(limit).Find(&bookings).Error; err != nil {
		return nil, 0, err
	}
	return bookings, total, nil
}

// Contracts

func (r *Repository) CreateContractTx(ctx context.Context, booking *models.Booking, startDate, endDate time.Time) (*models.Contract, error) {
	var contract *models.Contract
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		c := &models.Contract{
			BookingID: booking.ID,
			RoomID:    booking.RoomID,
			TenantID:  booking.TenantID,
			StartDate: startDate,
			EndDate:   endDate,
			Status:    models.ContractActive,
		}
		if err := tx.Create(c).Error; err != nil {
			return err
		}
		contract = c

		now := time.Now()
		decidedBy := booking.DecidedBy
		booking.Status = models.BookingApproved
		booking.DecidedAt = &now
		booking.DecidedBy = decidedBy
		if err := tx.Save(booking).Error; err != nil {
			return err
		}
		if err := tx.Model(&models.Room{}).Where("id = ?", booking.RoomID).Update("status", models.RoomOccupied).Error; err != nil {
			return err
		}
		return nil
	})
	return contract, err
}

func (r *Repository) GetContractByID(ctx context.Context, id uuid.UUID) (*models.Contract, error) {
	var c models.Contract
	if err := r.db.WithContext(ctx).Preload("Room").Preload("Booking").First(&c, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *Repository) UpdateContract(ctx context.Context, c *models.Contract) error {
	return r.db.WithContext(ctx).Save(c).Error
}

func (r *Repository) ListOwnerContracts(ctx context.Context, ownerID uuid.UUID, page, limit int) ([]models.Contract, int64, error) {
	q := r.db.WithContext(ctx).Model(&models.Contract{}).
		Joins("JOIN rooms ON rooms.id = contracts.room_id").
		Joins("JOIN kosts ON kosts.id = rooms.kost_id").
		Where("kosts.owner_id = ?", ownerID)
	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var contracts []models.Contract
	if err := q.Preload("Room").Preload("Tenant").Order("contracts.created_at DESC").Offset((page-1)*limit).Limit(limit).Find(&contracts).Error; err != nil {
		return nil, 0, err
	}
	return contracts, total, nil
}

func (r *Repository) ListTenantContracts(ctx context.Context, tenantID uuid.UUID, page, limit int) ([]models.Contract, int64, error) {
	q := r.db.WithContext(ctx).Model(&models.Contract{}).Where("tenant_id = ?", tenantID)
	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var contracts []models.Contract
	if err := q.Preload("Room").Order("created_at DESC").Offset((page-1)*limit).Limit(limit).Find(&contracts).Error; err != nil {
		return nil, 0, err
	}
	return contracts, total, nil
}

func (r *Repository) OwnerStats(ctx context.Context, ownerID uuid.UUID) (map[string]any, error) {
	var totalRooms int64
	r.db.WithContext(ctx).Table("rooms").Joins("JOIN kosts ON kosts.id = rooms.kost_id").Where("kosts.owner_id = ?", ownerID).Count(&totalRooms)

	var occupied int64
	r.db.WithContext(ctx).Table("rooms").Joins("JOIN kosts ON kosts.id = rooms.kost_id").Where("kosts.owner_id = ? AND rooms.status = ?", ownerID, models.RoomOccupied).Count(&occupied)

	var available int64
	r.db.WithContext(ctx).Table("rooms").Joins("JOIN kosts ON kosts.id = rooms.kost_id").Where("kosts.owner_id = ? AND rooms.status = ?", ownerID, models.RoomAvailable).Count(&available)

	var reserved int64
	r.db.WithContext(ctx).Table("rooms").Joins("JOIN kosts ON kosts.id = rooms.kost_id").Where("kosts.owner_id = ? AND rooms.status = ?", ownerID, models.RoomReserved).Count(&reserved)

	var pendingBookings int64
	r.db.WithContext(ctx).Table("bookings").Joins("JOIN rooms ON rooms.id = bookings.room_id").Joins("JOIN kosts ON kosts.id = rooms.kost_id").
		Where("kosts.owner_id = ? AND bookings.status = ?", ownerID, models.BookingPending).Count(&pendingBookings)

	var activeContracts int64
	r.db.WithContext(ctx).Table("contracts").Joins("JOIN rooms ON rooms.id = contracts.room_id").Joins("JOIN kosts ON kosts.id = rooms.kost_id").
		Where("kosts.owner_id = ? AND contracts.status = ?", ownerID, models.ContractActive).Count(&activeContracts)

	occupancy := 0.0
	if totalRooms > 0 {
		occupancy = float64(occupied) / float64(totalRooms) * 100
	}

	return map[string]any{
		"total_rooms":      totalRooms,
		"occupied":         occupied,
		"available":        available,
		"reserved":         reserved,
		"pending_bookings": pendingBookings,
		"active_contracts": activeContracts,
		"occupancy_rate":   occupancy,
	}, nil
}
