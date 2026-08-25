package bookings

import (
	"strings"
	"time"

	"kostify/backend/internal/http/response"
)

type CreateBookingInput struct {
	RoomID string `json:"room_id"`
}

func (in CreateBookingInput) Validate() []response.ErrorDetail {
	if strings.TrimSpace(in.RoomID) == "" {
		return []response.ErrorDetail{{Field: "room_id", Message: "room_id is required"}}
	}
	return nil
}

type ApproveBookingInput struct {
	StartDate      string `json:"start_date"`      // YYYY-MM-DD
	DurationMonths int    `json:"duration_months"` // 1-12
}

func (in ApproveBookingInput) Validate() []response.ErrorDetail {
	var errs []response.ErrorDetail
	if _, err := time.Parse("2006-01-02", in.StartDate); err != nil {
		errs = append(errs, response.ErrorDetail{Field: "start_date", Message: "must be YYYY-MM-DD"})
	}
	if in.DurationMonths < 1 || in.DurationMonths > 12 {
		errs = append(errs, response.ErrorDetail{Field: "duration_months", Message: "must be 1-12"})
	}
	return errs
}

type RejectBookingInput struct {
	Reason string `json:"reason"`
}

func (in RejectBookingInput) Validate() []response.ErrorDetail {
	if l := len(strings.TrimSpace(in.Reason)); l < 5 || l > 500 {
		return []response.ErrorDetail{{Field: "reason", Message: "must be 5-500 characters"}}
	}
	return nil
}
