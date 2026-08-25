package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type ErrorDetail struct {
	Field   string `json:"field,omitempty"`
	Message string `json:"message"`
}

type AppError struct {
	Status  int
	Code    string
	Message string
	Details []ErrorDetail
}

func (e *AppError) Error() string { return e.Message }

func NewError(status int, code, message string) *AppError {
	return &AppError{Status: status, Code: code, Message: message}
}

var (
	ErrBadRequest      = func(msg string) *AppError { return NewError(http.StatusBadRequest, "BAD_REQUEST", msg) }
	ErrUnauthorized    = NewError(http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required")
	ErrForbidden       = NewError(http.StatusForbidden, "FORBIDDEN", "You do not have permission to perform this action")
	ErrNotFound        = NewError(http.StatusNotFound, "NOT_FOUND", "Resource not found")
	ErrConflict        = func(msg string) *AppError { return NewError(http.StatusConflict, "CONFLICT", msg) }
	ErrValidation      = func(details []ErrorDetail) *AppError {
		return &AppError{Status: http.StatusUnprocessableEntity, Code: "VALIDATION_ERROR", Message: "Validation failed", Details: details}
	}
	ErrTooManyRequests = NewError(http.StatusTooManyRequests, "RATE_LIMITED", "Too many requests, please try again later")
	ErrInternal        = NewError(http.StatusInternalServerError, "INTERNAL_ERROR", "Something went wrong")
)

func OK(c *gin.Context, data any, message string) {
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    data,
		"message": message,
	})
}

func Created(c *gin.Context, data any, message string) {
	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    data,
		"message": message,
	})
}

func NoContent(c *gin.Context) {
	c.Status(http.StatusNoContent)
}

// AbortWith app error → consistent envelope; internal details never leaked.
func Fail(c *gin.Context, err error) {
	appErr, ok := err.(*AppError)
	if !ok {
		c.Error(err) // logged by recovery/logger chain
		appErr = ErrInternal
	}
	body := gin.H{
		"success": false,
		"error": gin.H{
			"code":    appErr.Code,
			"message": appErr.Message,
		},
	}
	if len(appErr.Details) > 0 {
		body["error"].(gin.H)["details"] = appErr.Details
	}
	c.AbortWithStatusJSON(appErr.Status, body)
}
