package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"net/http"

	"github.com/gin-gonic/gin"

	"kostify/backend/internal/config"
)

const (
	CookieAccess  = "access_token"
	CookieRefresh = "refresh_token"
	CookieCSRF    = "csrf_token"
)

func setAuthCookies(c *gin.Context, cfg *config.Config, access, refresh, csrf string) {
	secure := cfg.CookieSecure

	c.SetSameSite(http.SameSiteLaxMode)

	// HttpOnly cookies for tokens.
	c.SetCookie(CookieAccess, access, int(cfg.AccessTokenTTL.Seconds()), "/", "", secure, true)
	c.SetCookie(CookieRefresh, refresh, int(cfg.RefreshTokenTTL.Seconds()), "/api/v1/auth", "", secure, true)

	// CSRF: readable by JS.
	c.SetCookie(CookieCSRF, csrf, int(cfg.RefreshTokenTTL.Seconds()), "/", "", secure, false)
}

func setCSRFCookie(c *gin.Context, cfg *config.Config, csrf string) {
	secure := cfg.CookieSecure
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(CookieCSRF, csrf, int(cfg.RefreshTokenTTL.Seconds()), "/", "", secure, false)
}

func clearAuthCookies(c *gin.Context, cfg *config.Config) {
	secure := cfg.CookieSecure
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(CookieAccess, "", -1, "/", "", secure, true)
	c.SetCookie(CookieRefresh, "", -1, "/api/v1/auth", "", secure, true)
	c.SetCookie(CookieCSRF, "", -1, "/", "", secure, false)
}

func randomHex(n int) (string, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func hashToken(raw string) string {
	h := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(h[:])
}
