package kosts

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/gorm"

	"kostify/backend/internal/http/response"
	"kostify/backend/internal/models"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service { return &Service{repo: repo} }

// Kost

func (s *Service) CreateKost(ctx context.Context, ownerID uuid.UUID, in KostCreateInput) (*models.Kost, error) {
	gender := models.GenderCampur
	if in.Gender != "" {
		gender = models.KostGender(in.Gender)
	}
	k := &models.Kost{
		OwnerID:     ownerID,
		Name:        strings.TrimSpace(in.Name),
		Description: strings.TrimSpace(in.Description),
		Address:     strings.TrimSpace(in.Address),
		City:        strings.TrimSpace(in.City),
		Gender:      gender,
		Status:      models.KostPending,
		Photos:      pq.StringArray(in.Photos),
		Facilities:  pq.StringArray(in.Facilities),
	}
	if k.Photos == nil {
		k.Photos = pq.StringArray{}
	}
	if k.Facilities == nil {
		k.Facilities = pq.StringArray{}
	}
	if err := s.repo.CreateKost(ctx, k); err != nil {
		return nil, response.ErrInternal
	}
	return k, nil
}

func (s *Service) GetPublicKost(ctx context.Context, id uuid.UUID) (*models.Kost, []models.Room, error) {
	k, err := s.repo.GetKostByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil, response.ErrNotFound
		}
		return nil, nil, response.ErrInternal
	}
	if k.Status != models.KostVerified {
		return nil, nil, response.ErrNotFound
	}
	rooms, err := s.repo.ListRoomsByKost(ctx, k.ID)
	if err != nil {
		return nil, nil, response.ErrInternal
	}
	return k, rooms, nil
}

func (s *Service) ListPublic(ctx context.Context, q ListQuery) ([]models.Kost, int64, error) {
	return s.repo.ListKosts(ctx, q, nil, true)
}

func (s *Service) ListOwner(ctx context.Context, ownerID uuid.UUID, q ListQuery) ([]models.Kost, int64, error) {
	return s.repo.ListKosts(ctx, q, &ownerID, false)
}

func (s *Service) GetOwnerKost(ctx context.Context, ownerID, kostID uuid.UUID) (*models.Kost, error) {
	k, err := s.repo.GetKostByID(ctx, kostID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, response.ErrNotFound
		}
		return nil, response.ErrInternal
	}
	if k.OwnerID != ownerID {
		return nil, response.ErrNotFound
	}
	return k, nil
}

func (s *Service) UpdateKost(ctx context.Context, ownerID, kostID uuid.UUID, in KostUpdateInput) (*models.Kost, error) {
	k, err := s.repo.GetKostByID(ctx, kostID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, response.ErrNotFound
		}
		return nil, response.ErrInternal
	}
	if k.OwnerID != ownerID {
		return nil, response.ErrNotFound
	}
	if in.Name != nil {
		v := strings.TrimSpace(*in.Name)
		if l := len(v); l < 3 || l > 150 {
			return nil, response.ErrValidation([]response.ErrorDetail{{Field: "name", Message: "must be 3-150 characters"}})
		}
		k.Name = v
	}
	if in.Description != nil {
		if len(*in.Description) > 5000 {
			return nil, response.ErrValidation([]response.ErrorDetail{{Field: "description", Message: "must be at most 5000 characters"}})
		}
		k.Description = *in.Description
	}
	if in.Address != nil {
		k.Address = *in.Address
	}
	if in.City != nil {
		v := strings.TrimSpace(*in.City)
		if l := len(v); l < 2 || l > 100 {
			return nil, response.ErrValidation([]response.ErrorDetail{{Field: "city", Message: "must be 2-100 characters"}})
		}
		k.City = v
	}
	if in.Gender != nil {
		if !isValidGender(*in.Gender) {
			return nil, response.ErrValidation([]response.ErrorDetail{{Field: "gender", Message: "must be putra, putri or campur"}})
		}
		k.Gender = models.KostGender(*in.Gender)
	}
	if in.Photos != nil {
		k.Photos = pq.StringArray(*in.Photos)
	}
	if in.Facilities != nil {
		k.Facilities = pq.StringArray(*in.Facilities)
	}
	if err := s.repo.UpdateKost(ctx, k); err != nil {
		return nil, response.ErrInternal
	}
	return k, nil
}

// Room

func (s *Service) CreateRoom(ctx context.Context, ownerID, kostID uuid.UUID, in RoomCreateInput) (*models.Room, error) {
	k, err := s.repo.GetKostByID(ctx, kostID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, response.ErrNotFound
		}
		return nil, response.ErrInternal
	}
	if k.OwnerID != ownerID {
		return nil, response.ErrNotFound
	}
	status := models.RoomAvailable
	if in.Status != nil {
		status = models.RoomStatus(*in.Status)
	}
	rm := &models.Room{
		KostID:       kostID,
		RoomNumber:   strings.TrimSpace(in.RoomNumber),
		PriceMonthly: in.PriceMonthly,
		Status:       status,
		Photos:       pq.StringArray(in.Photos),
		Facilities:   pq.StringArray(in.Facilities),
	}
	if rm.Photos == nil {
		rm.Photos = pq.StringArray{}
	}
	if rm.Facilities == nil {
		rm.Facilities = pq.StringArray{}
	}
	if err := s.repo.CreateRoom(ctx, rm); err != nil {
		if errors.Is(err, gorm.ErrDuplicatedKey) || strings.Contains(err.Error(), "duplicate key") {
			return nil, response.ErrConflict("Room number already exists in this kost")
		}
		return nil, response.ErrInternal
	}
	return rm, nil
}

func (s *Service) UpdateRoom(ctx context.Context, ownerID, roomID uuid.UUID, in RoomUpdateInput) (*models.Room, error) {
	rm, err := s.repo.GetRoomByID(ctx, roomID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, response.ErrNotFound
		}
		return nil, response.ErrInternal
	}
	k, err := s.repo.GetKostByID(ctx, rm.KostID)
	if err != nil {
		return nil, response.ErrInternal
	}
	if k.OwnerID != ownerID {
		return nil, response.ErrNotFound
	}
	if in.RoomNumber != nil {
		v := strings.TrimSpace(*in.RoomNumber)
		if l := len(v); l < 1 || l > 20 {
			return nil, response.ErrValidation([]response.ErrorDetail{{Field: "room_number", Message: "must be 1-20 characters"}})
		}
		rm.RoomNumber = v
	}
	if in.PriceMonthly != nil {
		if *in.PriceMonthly <= 0 {
			return nil, response.ErrValidation([]response.ErrorDetail{{Field: "price_monthly", Message: "must be > 0"}})
		}
		rm.PriceMonthly = *in.PriceMonthly
	}
	if in.Photos != nil {
		rm.Photos = pq.StringArray(*in.Photos)
	}
	if in.Facilities != nil {
		rm.Facilities = pq.StringArray(*in.Facilities)
	}
	if in.Status != nil {
		if !isValidRoomStatus(*in.Status) {
			return nil, response.ErrValidation([]response.ErrorDetail{{Field: "status", Message: "must be available, reserved, occupied or maintenance"}})
		}
		// Only allow maintenance toggle from available; reserved/occupied managed by booking flow.
		newStatus := models.RoomStatus(*in.Status)
		if newStatus == models.RoomMaintenance && rm.Status != models.RoomAvailable {
			return nil, response.ErrValidation([]response.ErrorDetail{{Field: "status", Message: "only available rooms can be set to maintenance"}})
		}
		if rm.Status == models.RoomMaintenance && newStatus != models.RoomAvailable {
			return nil, response.ErrValidation([]response.ErrorDetail{{Field: "status", Message: "maintenance rooms can only return to available"}})
		}
		if rm.Status != models.RoomAvailable && rm.Status != models.RoomMaintenance && (newStatus == models.RoomAvailable || newStatus == models.RoomMaintenance) {
			return nil, response.ErrValidation([]response.ErrorDetail{{Field: "status", Message: "room status managed by booking system"}})
		}
		rm.Status = newStatus
	}
	if err := s.repo.UpdateRoom(ctx, rm); err != nil {
		if errors.Is(err, gorm.ErrDuplicatedKey) || strings.Contains(err.Error(), "duplicate key") {
			return nil, response.ErrConflict("Room number already exists in this kost")
		}
		return nil, response.ErrInternal
	}
	return rm, nil
}

func (s *Service) DeleteRoom(ctx context.Context, ownerID, roomID uuid.UUID) error {
	rm, err := s.repo.GetRoomByID(ctx, roomID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return response.ErrNotFound
		}
		return response.ErrInternal
	}
	k, err := s.repo.GetKostByID(ctx, rm.KostID)
	if err != nil {
		return response.ErrInternal
	}
	if k.OwnerID != ownerID {
		return response.ErrNotFound
	}
	if rm.Status != models.RoomAvailable {
		return response.ErrValidation([]response.ErrorDetail{{Field: "status", Message: "only available rooms can be deleted"}})
	}
	cnt, err := s.repo.CountActiveContractsForRoom(ctx, roomID)
	if err != nil {
		return response.ErrInternal
	}
	if cnt > 0 {
		return response.ErrConflict("Room has active contracts")
	}
	return s.repo.DeleteRoom(ctx, roomID)
}

func (s *Service) ListRooms(ctx context.Context, ownerID, kostID uuid.UUID) ([]models.Room, error) {
	k, err := s.repo.GetKostByID(ctx, kostID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, response.ErrNotFound
		}
		return nil, response.ErrInternal
	}
	if k.OwnerID != ownerID {
		return nil, response.ErrNotFound
	}
	return s.repo.ListRoomsByKost(ctx, kostID)
}

// Admin

func (s *Service) ListForAdmin(ctx context.Context, q ListQuery) ([]models.Kost, int64, error) {
	return s.repo.ListKosts(ctx, q, nil, false)
}

func (s *Service) VerifyKost(ctx context.Context, kostID uuid.UUID) (*models.Kost, error) {
	k, err := s.repo.GetKostByID(ctx, kostID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, response.ErrNotFound
		}
		return nil, response.ErrInternal
	}
	if k.Status == models.KostVerified {
		return k, nil
	}
	now := time.Now()
	k.Status = models.KostVerified
	k.VerifiedAt = &now
	k.RejectionNote = nil
	if err := s.repo.UpdateKost(ctx, k); err != nil {
		return nil, response.ErrInternal
	}
	return k, nil
}

func (s *Service) RejectKost(ctx context.Context, kostID uuid.UUID, note string) (*models.Kost, error) {
	k, err := s.repo.GetKostByID(ctx, kostID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, response.ErrNotFound
		}
		return nil, response.ErrInternal
	}
	k.Status = models.KostRejected
	k.RejectionNote = &note
	k.VerifiedAt = nil
	if err := s.repo.UpdateKost(ctx, k); err != nil {
		return nil, response.ErrInternal
	}
	return k, nil
}
