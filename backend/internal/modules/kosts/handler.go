package kosts

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"kostify/backend/internal/http/middleware"
	"kostify/backend/internal/http/response"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

// Public

func (h *Handler) ListPublic(c *gin.Context) {
	q := parseListQuery(map[string]string{
		"page": c.Query("page"), "limit": c.Query("limit"), "search": c.Query("search"),
		"city": c.Query("city"), "gender": c.Query("gender"), "facilities": c.Query("facilities"),
		"min_price": c.Query("min_price"), "max_price": c.Query("max_price"),
		"sort": c.Query("sort"), "order": c.Query("order"),
	})
	kosts, total, err := h.svc.ListPublic(c.Request.Context(), q)
	if err != nil {
		response.Fail(c, err)
		return
	}
	response.OK(c, paginated(kosts, q.Page, q.Limit, total), "OK")
}

func (h *Handler) GetPublic(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Fail(c, response.NewError(http.StatusBadRequest, "BAD_REQUEST", "Invalid kost id"))
		return
	}
	kost, rooms, err := h.svc.GetPublicKost(c.Request.Context(), id)
	if err != nil {
		response.Fail(c, err)
		return
	}
	response.OK(c, gin.H{"kost": kost, "rooms": rooms}, "OK")
}

// Owner

func (h *Handler) ListOwner(c *gin.Context) {
	ownerID := middleware.CurrentUser(c).ID
	q := parseListQuery(map[string]string{
		"page": c.Query("page"), "limit": c.Query("limit"), "search": c.Query("search"),
		"city": c.Query("city"), "gender": c.Query("gender"), "facilities": c.Query("facilities"),
		"min_price": c.Query("min_price"), "max_price": c.Query("max_price"),
		"sort": c.Query("sort"), "order": c.Query("order"), "status": c.Query("status"),
	})
	kosts, total, err := h.svc.ListOwner(c.Request.Context(), ownerID, q)
	if err != nil {
		response.Fail(c, err)
		return
	}
	response.OK(c, paginated(kosts, q.Page, q.Limit, total), "OK")
}

func (h *Handler) CreateKost(c *gin.Context) {
	var in KostCreateInput
	if err := c.ShouldBindJSON(&in); err != nil {
		response.Fail(c, response.ErrBadRequest("Invalid request body"))
		return
	}
	if errs := in.Validate(); len(errs) > 0 {
		response.Fail(c, response.ErrValidation(errs))
		return
	}
	ownerID := middleware.CurrentUser(c).ID
	kost, err := h.svc.CreateKost(c.Request.Context(), ownerID, in)
	if err != nil {
		response.Fail(c, err)
		return
	}
	response.Created(c, kost, "Kost created and pending verification")
}

func (h *Handler) GetOwnerKost(c *gin.Context) {
	kostID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Fail(c, response.NewError(http.StatusBadRequest, "BAD_REQUEST", "Invalid kost id"))
		return
	}
	ownerID := middleware.CurrentUser(c).ID
	kost, err := h.svc.GetOwnerKost(c.Request.Context(), ownerID, kostID)
	if err != nil {
		response.Fail(c, err)
		return
	}
	response.OK(c, kost, "OK")
}

func (h *Handler) UpdateKost(c *gin.Context) {
	kostID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Fail(c, response.NewError(http.StatusBadRequest, "BAD_REQUEST", "Invalid kost id"))
		return
	}
	var in KostUpdateInput
	if err := c.ShouldBindJSON(&in); err != nil {
		response.Fail(c, response.ErrBadRequest("Invalid request body"))
		return
	}
	ownerID := middleware.CurrentUser(c).ID
	kost, err := h.svc.UpdateKost(c.Request.Context(), ownerID, kostID, in)
	if err != nil {
		response.Fail(c, err)
		return
	}
	response.OK(c, kost, "Kost updated")
}

func (h *Handler) CreateRoom(c *gin.Context) {
	kostID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Fail(c, response.NewError(http.StatusBadRequest, "BAD_REQUEST", "Invalid kost id"))
		return
	}
	var in RoomCreateInput
	if err := c.ShouldBindJSON(&in); err != nil {
		response.Fail(c, response.ErrBadRequest("Invalid request body"))
		return
	}
	if errs := in.Validate(); len(errs) > 0 {
		response.Fail(c, response.ErrValidation(errs))
		return
	}
	ownerID := middleware.CurrentUser(c).ID
	room, err := h.svc.CreateRoom(c.Request.Context(), ownerID, kostID, in)
	if err != nil {
		response.Fail(c, err)
		return
	}
	response.Created(c, room, "Room created")
}

func (h *Handler) ListRooms(c *gin.Context) {
	kostID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Fail(c, response.NewError(http.StatusBadRequest, "BAD_REQUEST", "Invalid kost id"))
		return
	}
	ownerID := middleware.CurrentUser(c).ID
	rooms, err := h.svc.ListRooms(c.Request.Context(), ownerID, kostID)
	if err != nil {
		response.Fail(c, err)
		return
	}
	response.OK(c, rooms, "OK")
}

func (h *Handler) UpdateRoom(c *gin.Context) {
	roomID, err := uuid.Parse(c.Param("roomId"))
	if err != nil {
		roomID, err = uuid.Parse(c.Param("id"))
		if err != nil {
			response.Fail(c, response.NewError(http.StatusBadRequest, "BAD_REQUEST", "Invalid room id"))
			return
		}
	}
	var in RoomUpdateInput
	if err := c.ShouldBindJSON(&in); err != nil {
		response.Fail(c, response.ErrBadRequest("Invalid request body"))
		return
	}
	ownerID := middleware.CurrentUser(c).ID
	room, err := h.svc.UpdateRoom(c.Request.Context(), ownerID, roomID, in)
	if err != nil {
		response.Fail(c, err)
		return
	}
	response.OK(c, room, "Room updated")
}

func (h *Handler) DeleteRoom(c *gin.Context) {
	roomID, err := uuid.Parse(c.Param("roomId"))
	if err != nil {
		roomID, err = uuid.Parse(c.Param("id"))
		if err != nil {
			response.Fail(c, response.NewError(http.StatusBadRequest, "BAD_REQUEST", "Invalid room id"))
			return
		}
	}
	ownerID := middleware.CurrentUser(c).ID
	if err := h.svc.DeleteRoom(c.Request.Context(), ownerID, roomID); err != nil {
		response.Fail(c, err)
		return
	}
	response.NoContent(c)
}

// Admin

func (h *Handler) ListAdmin(c *gin.Context) {
	q := parseListQuery(map[string]string{
		"page": c.Query("page"), "limit": c.Query("limit"), "search": c.Query("search"),
		"city": c.Query("city"), "gender": c.Query("gender"), "status": c.Query("status"),
		"sort": c.Query("sort"), "order": c.Query("order"),
	})
	kosts, total, err := h.svc.ListForAdmin(c.Request.Context(), q)
	if err != nil {
		response.Fail(c, err)
		return
	}
	response.OK(c, paginated(kosts, q.Page, q.Limit, total), "OK")
}

func (h *Handler) VerifyKost(c *gin.Context) {
	kostID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Fail(c, response.NewError(http.StatusBadRequest, "BAD_REQUEST", "Invalid kost id"))
		return
	}
	kost, err := h.svc.VerifyKost(c.Request.Context(), kostID)
	if err != nil {
		response.Fail(c, err)
		return
	}
	response.OK(c, kost, "Kost verified")
}

func (h *Handler) RejectKost(c *gin.Context) {
	kostID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Fail(c, response.NewError(http.StatusBadRequest, "BAD_REQUEST", "Invalid kost id"))
		return
	}
	var body struct {
		Note string `json:"note"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || strings.TrimSpace(body.Note) == "" {
		response.Fail(c, response.ErrValidation([]response.ErrorDetail{{Field: "note", Message: "rejection note is required"}}))
		return
	}
	kost, err := h.svc.RejectKost(c.Request.Context(), kostID, strings.TrimSpace(body.Note))
	if err != nil {
		response.Fail(c, err)
		return
	}
	response.OK(c, kost, "Kost rejected")
}

func paginated(items any, page, limit int, total int64) gin.H {
	totalPages := int((total + int64(limit) - 1) / int64(limit))
	if totalPages < 1 {
		totalPages = 1
	}
	return gin.H{
		"items": items,
		"pagination": gin.H{
			"page": page, "limit": limit, "total": total, "total_pages": totalPages,
		},
	}
}
