package bookings

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"kostify/backend/internal/http/response"
	"kostify/backend/internal/models"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service { return &Service{repo: repo} }

func (s *Service) Create(ctx context.Context, tenantID, roomID uuid.UUID) (*models.Booking, error) {
	booking, err := s.repo.CreateBookingTx(ctx, tenantID, roomID)
	if err != nil {
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			// Could be room not available (we reused ErrDuplicatedKey) or unique index.
			if strings.Contains(err.Error(), "duplicate key") || err == gorm.ErrDuplicatedKey {
				return nil, response.ErrConflict("Room already has a pending booking or is not available")
			}
		}
		if strings.Contains(err.Error(), "duplicate key") {
			return nil, response.ErrConflict("Room already has a pending booking")
		}
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, response.ErrNotFound
		}
		// Room not available signaled via duplicated key with custom message.
		if err.Error() == "room not available" {
			return nil, response.ErrConflict("Room is not available")
		}
		// Check our custom error from repo (we returned ErrDuplicatedKey for status check)
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			return nil, response.ErrConflict("Room is not available")
		}
		return nil, response.ErrInternal
	}
	return booking, nil
}

func (s *Service) Cancel(ctx context.Context, tenantID, bookingID uuid.UUID) (*models.Booking, error) {
	b, err := s.repo.GetBookingByID(ctx, bookingID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, response.ErrNotFound
		}
		return nil, response.ErrInternal
	}
	if b.TenantID != tenantID {
		return nil, response.ErrNotFound
	}
	if b.Status != models.BookingPending {
		return nil, response.ErrValidation([]response.ErrorDetail{{Field: "status", Message: "only pending bookings can be cancelled"}})
	}

	err = s.repo.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.Booking{}).Where("id = ? AND status = ?", bookingID, models.BookingPending).
			Updates(map[string]any{"status": models.BookingCancelled, "updated_at": time.Now()}).Error; err != nil {
			return err
		}
		return tx.Model(&models.Room{}).Where("id = ? AND status = ?", b.RoomID, models.RoomReserved).
			Update("status", models.RoomAvailable).Error
	})
	if err != nil {
		return nil, response.ErrInternal
	}
	b.Status = models.BookingCancelled
	return b, nil
}

func (s *Service) Approve(ctx context.Context, ownerID, bookingID uuid.UUID, startDateStr string, duration int) (*models.Contract, error) {
	b, kost, err := s.repo.GetBookingWithKostOwner(ctx, bookingID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, response.ErrNotFound
		}
		return nil, response.ErrInternal
	}
	if kost.OwnerID != ownerID {
		return nil, response.ErrNotFound
	}
	if b.Status != models.BookingPending {
		return nil, response.ErrValidation([]response.ErrorDetail{{Field: "status", Message: "only pending bookings can be approved"}})
	}
	if b.ExpiresAt.Before(time.Now()) {
		return nil, response.ErrValidation([]response.ErrorDetail{{Field: "status", Message: "booking has expired"}})
	}
	startDate, _ := time.Parse("2006-01-02", startDateStr)
	endDate := startDate.AddDate(0, duration, 0)
	// Mark who decided.
	b.DecidedBy = &ownerID
	contract, err := s.repo.CreateContractTx(ctx, b, startDate, endDate)
	if err != nil {
		if errors.Is(err, gorm.ErrDuplicatedKey) || strings.Contains(err.Error(), "duplicate key") {
			return nil, response.ErrConflict("Contract already exists for this booking")
		}
		return nil, response.ErrInternal
	}
	return contract, nil
}

func (s *Service) Reject(ctx context.Context, ownerID, bookingID uuid.UUID, reason string) (*models.Booking, error) {
	b, kost, err := s.repo.GetBookingWithKostOwner(ctx, bookingID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, response.ErrNotFound
		}
		return nil, response.ErrInternal
	}
	if kost.OwnerID != ownerID {
		return nil, response.ErrNotFound
	}
	if b.Status != models.BookingPending {
		return nil, response.ErrValidation([]response.ErrorDetail{{Field: "status", Message: "only pending bookings can be rejected"}})
	}
	now := time.Now()
	b.Status = models.BookingRejected
	b.RejectReason = &reason
	b.DecidedBy = &ownerID
	b.DecidedAt = &now

	err = s.repo.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(b).Error; err != nil {
			return err
		}
		return tx.Model(&models.Room{}).Where("id = ? AND status = ?", b.RoomID, models.RoomReserved).
			Update("status", models.RoomAvailable).Error
	})
	if err != nil {
		return nil, response.ErrInternal
	}
	return b, nil
}

func (s *Service) ListTenant(ctx context.Context, tenantID uuid.UUID, page, limit int, status string) ([]models.Booking, int64, error) {
	return s.repo.ListTenantBookings(ctx, tenantID, page, limit, status)
}

func (s *Service) ListOwner(ctx context.Context, ownerID uuid.UUID, page, limit int, status string) ([]models.Booking, int64, error) {
	return s.repo.ListOwnerBookings(ctx, ownerID, page, limit, status)
}

func (s *Service) EndContract(ctx context.Context, ownerID, contractID uuid.UUID) (*models.Contract, error) {
	c, err := s.repo.GetContractByID(ctx, contractID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, response.ErrNotFound
		}
		return nil, response.ErrInternal
	}
	if c.Status != models.ContractActive {
		return nil, response.ErrValidation([]response.ErrorDetail{{Field: "status", Message: "only active contracts can be ended"}})
	}
	// Verify ownership via room->kost.
	var kost models.Kost
	if err := s.repo.db.WithContext(ctx).
		Joins("JOIN rooms ON rooms.id = ?", c.RoomID).
		Where("rooms.kost_id = kosts.id").
		First(&kost).Error; err != nil {
		// Fallback: load room then kost.
		var room models.Room
		if err2 := s.repo.db.WithContext(ctx).First(&room, "id = ?", c.RoomID).Error; err2 != nil {
			return nil, response.ErrInternal
		}
		if err2 := s.repo.db.WithContext(ctx).First(&kost, "id = ?", room.KostID).Error; err2 != nil {
			return nil, response.ErrInternal
		}
	}
	if kost.OwnerID != ownerID {
		return nil, response.ErrNotFound
	}

	now := time.Now()
	c.Status = models.ContractEnded
	c.EndedBy = &ownerID
	c.EndedAt = &now

	err = s.repo.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(c).Error; err != nil {
			return err
		}
		return tx.Model(&models.Room{}).Where("id = ?", c.RoomID).Update("status", models.RoomAvailable).Error
	})
	if err != nil {
		return nil, response.ErrInternal
	}
	return c, nil
}

func (s *Service) ListOwnerContracts(ctx context.Context, ownerID uuid.UUID, page, limit int) ([]models.Contract, int64, error) {
	return s.repo.ListOwnerContracts(ctx, ownerID, page, limit)
}

func (s *Service) ListTenantContracts(ctx context.Context, tenantID uuid.UUID, page, limit int) ([]models.Contract, int64, error) {
	return s.repo.ListTenantContracts(ctx, tenantID, page, limit)
}

func (s *Service) Stats(ctx context.Context, ownerID uuid.UUID) (map[string]any, error) {
	return s.repo.OwnerStats(ctx, ownerID)
}
