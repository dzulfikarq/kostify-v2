package middleware

import (
	"crypto/subtle"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"kostify/backend/internal/http/response"
)

// CSRF implements the double-submit cookie pattern: a non-HttpOnly
// `csrf_token` cookie must match the X-CSRF-Token request header on every
// state-changing request. Combined with SameSite=Lax cookies (first-party,
// proxied same-origin frontend) this blocks cross-site request forgery.
// ponytail: constant-time compare, no per-session server state needed.
func CSRF() gin.HandlerFunc {
	const headerName = "X-CSRF-Token"
	const cookieName = "csrf_token"

	return func(c *gin.Context) {
		switch c.Request.Method {
		case http.MethodGet, http.MethodHead, http.MethodOptions:
			c.Next()
			return
		}

		cookieToken, err := c.Cookie(cookieName)
		if err != nil || cookieToken == "" {
			response.Fail(c, response.NewError(http.StatusForbidden, "CSRF_INVALID", "Missing CSRF token"))
			return
		}
		headerToken := c.GetHeader(headerName)
		if headerToken == "" ||
			subtle.ConstantTimeCompare([]byte(cookieToken), []byte(headerToken)) != 1 {
			response.Fail(c, response.NewError(http.StatusForbidden, "CSRF_INVALID", "Invalid CSRF token"))
			return
		}
		c.Next()
	}
}

// csrfExemptPath marks pre-authentication endpoints that cannot carry a
// token yet (login/register/refresh). SameSite=Lax already prevents
// cross-site POSTs from carrying session cookies.
func IsCSRFExempt(path string) bool {
	for _, suffix := range []string{"/auth/login", "/auth/register", "/auth/refresh"} {
		if strings.HasSuffix(path, suffix) {
			return true
		}
	}
	return false
}
