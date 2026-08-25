package uploads

import (
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"kostify/backend/internal/http/response"
	mclient "kostify/backend/internal/platform/minio"
)

var allowedMIMEs = map[string]string{
	"image/jpeg": ".jpg",
	"image/png":  ".png",
	"image/webp": ".webp",
}

type Handler struct {
	storage *mclient.Client
}

func NewHandler(storage *mclient.Client) *Handler { return &Handler{storage: storage} }

func (h *Handler) UploadImage(c *gin.Context) {
	if h.storage == nil {
		response.Fail(c, response.NewError(http.StatusServiceUnavailable, "STORAGE_UNAVAILABLE", "File storage not configured"))
		return
	}
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		response.Fail(c, response.ErrValidation([]response.ErrorDetail{{Field: "file", Message: "file is required"}}))
		return
	}
	defer func() { _ = file.Close() }()

	if header.Size > 2<<20 {
		response.Fail(c, response.ErrValidation([]response.ErrorDetail{{Field: "file", Message: "file must be at most 2 MB"}}))
		return
	}

	// Read limited (2 MB + 1 to detect overflow).
	limited := io.LimitReader(file, 2<<20+1)
	data, err := io.ReadAll(limited)
	if err != nil {
		response.Fail(c, response.ErrInternal)
		return
	}
	if int64(len(data)) > 2<<20 {
		response.Fail(c, response.ErrValidation([]response.ErrorDetail{{Field: "file", Message: "file must be at most 2 MB"}}))
		return
	}
	if len(data) == 0 {
		response.Fail(c, response.ErrValidation([]response.ErrorDetail{{Field: "file", Message: "file is empty"}}))
		return
	}

	mime := http.DetectContentType(data[:min(512, len(data))])
	ext, ok := allowedMIMEs[mime]
	if !ok {
		// Fallback: check extension.
		extFromName := strings.ToLower(filepath.Ext(header.Filename))
		if extFromName == ".jpg" {
			extFromName = ".jpg"
			mime = "image/jpeg"
		}
		if _, ok2 := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".webp": true}[extFromName]; !ok2 {
			response.Fail(c, response.ErrValidation([]response.ErrorDetail{{Field: "file", Message: "only jpeg, png and webp are allowed"}}))
			return
		}
		if extFromName == ".jpeg" {
			ext = ".jpg"
		} else {
			ext = extFromName
		}
	}

	key := fmt.Sprintf("uploads/%s%s", uuid.NewString(), ext)

	url, err := h.storage.Put(c.Request.Context(), key, data, mime)
	if err != nil {
		response.Fail(c, response.ErrInternal)
		return
	}
	response.Created(c, gin.H{"url": url, "mime": mime, "size": len(data)}, "Uploaded")
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
