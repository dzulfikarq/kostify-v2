package kosts

import (
	"strconv"
	"strings"

	"kostify/backend/internal/http/response"
	"kostify/backend/internal/models"
)

type KostCreateInput struct {
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Address     string   `json:"address"`
	City        string   `json:"city"`
	Gender      string   `json:"gender"`
	Photos      []string `json:"photos"`
	Facilities  []string `json:"facilities"`
}

type KostUpdateInput struct {
	Name        *string   `json:"name"`
	Description *string   `json:"description"`
	Address     *string   `json:"address"`
	City        *string   `json:"city"`
	Gender      *string   `json:"gender"`
	Photos      *[]string `json:"photos"`
	Facilities  *[]string `json:"facilities"`
}

type RoomCreateInput struct {
	RoomNumber   string   `json:"room_number"`
	PriceMonthly float64  `json:"price_monthly"`
	Photos       []string `json:"photos"`
	Facilities   []string `json:"facilities"`
	Status       *string  `json:"status"`
}

type RoomUpdateInput struct {
	RoomNumber   *string   `json:"room_number"`
	PriceMonthly *float64  `json:"price_monthly"`
	Photos       *[]string `json:"photos"`
	Facilities   *[]string `json:"facilities"`
	Status       *string   `json:"status"`
}

func (in KostCreateInput) Validate() []response.ErrorDetail {
	var errs []response.ErrorDetail
	if l := len(strings.TrimSpace(in.Name)); l < 3 || l > 150 {
		errs = append(errs, response.ErrorDetail{Field: "name", Message: "must be 3-150 characters"})
	}
	if l := len(strings.TrimSpace(in.City)); l < 2 || l > 100 {
		errs = append(errs, response.ErrorDetail{Field: "city", Message: "must be 2-100 characters"})
	}
	if in.Gender != "" && !isValidGender(in.Gender) {
		errs = append(errs, response.ErrorDetail{Field: "gender", Message: "must be putra, putri or campur"})
	}
	if len(in.Description) > 5000 {
		errs = append(errs, response.ErrorDetail{Field: "description", Message: "must be at most 5000 characters"})
	}
	if len(in.Address) > 500 {
		errs = append(errs, response.ErrorDetail{Field: "address", Message: "must be at most 500 characters"})
	}
	if len(in.Photos) > 20 {
		errs = append(errs, response.ErrorDetail{Field: "photos", Message: "at most 20 photos"})
	}
	return errs
}

func (in RoomCreateInput) Validate() []response.ErrorDetail {
	var errs []response.ErrorDetail
	if l := len(strings.TrimSpace(in.RoomNumber)); l < 1 || l > 20 {
		errs = append(errs, response.ErrorDetail{Field: "room_number", Message: "must be 1-20 characters"})
	}
	if in.PriceMonthly <= 0 {
		errs = append(errs, response.ErrorDetail{Field: "price_monthly", Message: "must be > 0"})
	}
	if in.Status != nil && !isValidRoomStatus(*in.Status) {
		errs = append(errs, response.ErrorDetail{Field: "status", Message: "must be available, reserved, occupied or maintenance"})
	}
	return errs
}

func isValidGender(s string) bool {
	for _, v := range []models.KostGender{models.GenderPutra, models.GenderPutri, models.GenderCampur} {
		if string(v) == s {
			return true
		}
	}
	return false
}

func isValidRoomStatus(s string) bool {
	for _, v := range []models.RoomStatus{models.RoomAvailable, models.RoomReserved, models.RoomOccupied, models.RoomMaintenance} {
		if string(v) == s {
			return true
		}
	}
	return false
}

type ListQuery struct {
	Page       int
	Limit      int
	Search     string
	City       string
	Gender     string
	Facilities []string
	MinPrice   *float64
	MaxPrice   *float64
	Sort       string
	Order      string
	Status     string // for admin/owner filtering
}

func parseListQuery(params map[string]string) ListQuery {
	q := ListQuery{
		Search: strings.TrimSpace(params["search"]),
		City:   strings.TrimSpace(params["city"]),
		Gender: strings.TrimSpace(params["gender"]),
		Sort:   strings.TrimSpace(params["sort"]),
		Order:  strings.ToLower(strings.TrimSpace(params["order"])),
		Status: strings.TrimSpace(params["status"]),
	}
	if q.Sort == "" {
		q.Sort = "created_at"
	}
	if q.Order != "asc" {
		q.Order = "desc"
	}
	q.Page, _ = strconv.Atoi(params["page"])
	if q.Page < 1 {
		q.Page = 1
	}
	q.Limit, _ = strconv.Atoi(params["limit"])
	if q.Limit < 1 || q.Limit > 100 {
		q.Limit = 20
	}
	if fac := strings.TrimSpace(params["facilities"]); fac != "" {
		for _, f := range strings.Split(fac, ",") {
			f = strings.TrimSpace(f)
			if f != "" {
				q.Facilities = append(q.Facilities, f)
			}
		}
	}
	if v := strings.TrimSpace(params["min_price"]); v != "" {
		if f, err := strconv.ParseFloat(v, 64); err == nil {
			q.MinPrice = &f
		}
	}
	if v := strings.TrimSpace(params["max_price"]); v != "" {
		if f, err := strconv.ParseFloat(v, 64); err == nil {
			q.MaxPrice = &f
		}
	}
	return q
}
