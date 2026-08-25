package auth

import (
	"errors"
	"regexp"
	"strings"

	"kostify/backend/internal/http/response"
)

type RegisterInput struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
	Password string `json:"password"`
	Role     string `json:"role"`
}

type LoginInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type ApproveBookingInput = struct{} // placeholder to keep module shape consistent

var emailPattern = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)

func (in *RegisterInput) Validate() []response.ErrorDetail {
	var errs []response.ErrorDetail
	if l := len(strings.TrimSpace(in.Name)); l < 2 || l > 120 {
		errs = append(errs, response.ErrorDetail{Field: "name", Message: "must be 2-120 characters"})
	}
	in.Email = strings.ToLower(strings.TrimSpace(in.Email))
	if !emailPattern.MatchString(in.Email) {
		errs = append(errs, response.ErrorDetail{Field: "email", Message: "must be a valid email address"})
	}
	if in.Phone != "" && len(in.Phone) > 20 {
		errs = append(errs, response.ErrorDetail{Field: "phone", Message: "must be at most 20 characters"})
	}
	if len(in.Password) < 8 || len(in.Password) > 72 {
		errs = append(errs, response.ErrorDetail{Field: "password", Message: "must be 8-72 characters"})
	}
	switch in.Role {
	case "":
		in.Role = string("tenant")
	case "tenant", "owner":
	default:
		errs = append(errs, response.ErrorDetail{Field: "role", Message: "must be one of: tenant, owner"})
	}
	return errs
}

func (in *LoginInput) Validate() error {
	in.Email = strings.ToLower(strings.TrimSpace(in.Email))
	if in.Email == "" || in.Password == "" {
		return errors.New("email and password are required")
	}
	return nil
}
