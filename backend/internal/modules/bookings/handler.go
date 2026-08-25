package bookings

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"kostify/backend/internal/http/middleware"
	"kostify/backend/internal/http/response"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

func (h *Handler) Create(c *gin.Context) {
	var in CreateBookingInput
	if err := c.ShouldBindJSON(&in); err != nil {
		response.Fail(c, response.ErrBadRequest("Invalid request body"))
		return
	}
	if errs := in.Validate(); len(errs) > 0 {
		response.Fail(c, response.ErrValidation(errs))
		return
	}
	roomID, err := uuid.Parse(strings.TrimSpace(in.RoomID))
	if err != nil {
		response.Fail(c, response.ErrValidation([]response.ErrorDetail{{Field: "room_id", Message: "must be a valid UUID"}}))
		return
	}
	tenantID := middleware.CurrentUser(c).ID
	var surveyDate *time.Time
	if in.SurveyDate != "" {
		if sd, err := time.ParseInLocation("2006-01-02", in.SurveyDate, time.Local); err == nil {
			surveyDate = &sd
		}
	}
	booking, err := h.svc.Create(c.Request.Context(), tenantID, roomID, surveyDate)
	if err != nil {
		response.Fail(c, err)
		return
	}
	response.Created(c, booking, "Booking created (pending, expires in 72h)")
}

func (h *Handler) ListMe(c *gin.Context) {
	tenantID := middleware.CurrentUser(c).ID
	page, limit := parsePageLimit(c)
	status := strings.TrimSpace(c.Query("status"))
	bookings, total, err := h.svc.ListTenant(c.Request.Context(), tenantID, page, limit, status)
	if err != nil {
		response.Fail(c, err)
		return
	}
	response.OK(c, paginated(bookings, page, limit, total), "OK")
}

func (h *Handler) Cancel(c *gin.Context) {
	bookingID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Fail(c, response.NewError(http.StatusBadRequest, "BAD_REQUEST", "Invalid booking id"))
		return
	}
	tenantID := middleware.CurrentUser(c).ID
	booking, err := h.svc.Cancel(c.Request.Context(), tenantID, bookingID)
	if err != nil {
		response.Fail(c, err)
		return
	}
	response.OK(c, booking, "Booking cancelled")
}

func (h *Handler) ListOwner(c *gin.Context) {
	ownerID := middleware.CurrentUser(c).ID
	page, limit := parsePageLimit(c)
	status := strings.TrimSpace(c.Query("status"))
	bookings, total, err := h.svc.ListOwner(c.Request.Context(), ownerID, page, limit, status)
	if err != nil {
		response.Fail(c, err)
		return
	}
	response.OK(c, paginated(bookings, page, limit, total), "OK")
}

func (h *Handler) Approve(c *gin.Context) {
	bookingID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Fail(c, response.NewError(http.StatusBadRequest, "BAD_REQUEST", "Invalid booking id"))
		return
	}
	var in ApproveBookingInput
	if err := c.ShouldBindJSON(&in); err != nil {
		response.Fail(c, response.ErrBadRequest("Invalid request body"))
		return
	}
	if errs := in.Validate(); len(errs) > 0 {
		response.Fail(c, response.ErrValidation(errs))
		return
	}
	ownerID := middleware.CurrentUser(c).ID
	contract, err := h.svc.Approve(c.Request.Context(), ownerID, bookingID, in.StartDate, in.DurationMonths)
	if err != nil {
		response.Fail(c, err)
		return
	}
	response.OK(c, contract, "Booking approved, contract created")
}

func (h *Handler) Reject(c *gin.Context) {
	bookingID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Fail(c, response.NewError(http.StatusBadRequest, "BAD_REQUEST", "Invalid booking id"))
		return
	}
	var in RejectBookingInput
	if err := c.ShouldBindJSON(&in); err != nil {
		response.Fail(c, response.ErrBadRequest("Invalid request body"))
		return
	}
	if errs := in.Validate(); len(errs) > 0 {
		response.Fail(c, response.ErrValidation(errs))
		return
	}
	ownerID := middleware.CurrentUser(c).ID
	booking, err := h.svc.Reject(c.Request.Context(), ownerID, bookingID, strings.TrimSpace(in.Reason))
	if err != nil {
		response.Fail(c, err)
		return
	}
	response.OK(c, booking, "Booking rejected")
}

func (h *Handler) ListOwnerContracts(c *gin.Context) {
	ownerID := middleware.CurrentUser(c).ID
	page, limit := parsePageLimit(c)
	contracts, total, err := h.svc.ListOwnerContracts(c.Request.Context(), ownerID, page, limit)
	if err != nil {
		response.Fail(c, err)
		return
	}
	response.OK(c, paginated(contracts, page, limit, total), "OK")
}

func (h *Handler) ListTenantContracts(c *gin.Context) {
	tenantID := middleware.CurrentUser(c).ID
	page, limit := parsePageLimit(c)
	contracts, total, err := h.svc.ListTenantContracts(c.Request.Context(), tenantID, page, limit)
	if err != nil {
		response.Fail(c, err)
		return
	}
	response.OK(c, paginated(contracts, page, limit, total), "OK")
}

func (h *Handler) EndContract(c *gin.Context) {
	contractID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Fail(c, response.NewError(http.StatusBadRequest, "BAD_REQUEST", "Invalid contract id"))
		return
	}
	ownerID := middleware.CurrentUser(c).ID
	contract, err := h.svc.EndContract(c.Request.Context(), ownerID, contractID)
	if err != nil {
		response.Fail(c, err)
		return
	}
	response.OK(c, contract, "Contract ended")
}

func (h *Handler) Stats(c *gin.Context) {
	ownerID := middleware.CurrentUser(c).ID
	stats, err := h.svc.Stats(c.Request.Context(), ownerID)
	if err != nil {
		response.Fail(c, err)
		return
	}
	response.OK(c, stats, "OK")
}

func parsePageLimit(c *gin.Context) (int, int) {
	page, _ := strconv.Atoi(c.Query("page"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(c.Query("limit"))
	if limit < 1 || limit > 100 {
		limit = 20
	}
	return page, limit
}

func paginated(items any, page, limit int, total int64) gin.H {
	totalPages := int((total + int64(limit) - 1) / int64(limit))
	if totalPages < 1 {
		totalPages = 1
	}
	return gin.H{"items": items, "pagination": gin.H{"page": page, "limit": limit, "total": total, "total_pages": totalPages}}
}
