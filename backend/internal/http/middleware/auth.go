package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"kostify/backend/internal/http/response"
	"kostify/backend/internal/models"
)

const (
	CtxUserKey   = "auth_user"
	CtxUserIDKey = "auth_user_id"
)

func secretProvider(getSecret func() string) jwt.Keyfunc {
	return func(t *jwt.Token) (any, error) { return []byte(getSecret()), nil }
}

// RequireAuth reads the HttpOnly access-token cookie, validates the JWT and
// loads a fresh user record (so deactivated users lose access instantly).
func RequireAuth(db *gorm.DB, getSecret func() string) gin.HandlerFunc {
	return func(c *gin.Context) {
		raw, err := c.Cookie("access_token")
		if err != nil || raw == "" {
			response.Fail(c, response.ErrUnauthorized)
			return
		}

		token, err := jwt.Parse(raw, secretProvider(getSecret),
			jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
			jwt.WithExpirationRequired(),
		)
		if err != nil || !token.Valid {
			response.Fail(c, response.ErrUnauthorized)
			return
		}

		claims := token.Claims.(jwt.MapClaims)
		sub, _ := claims["sub"].(string)
		userID, err := uuid.Parse(sub)
		if err != nil {
			response.Fail(c, response.ErrUnauthorized)
			return
		}

		var user models.User
		if err := db.WithContext(c).First(&user, "id = ? AND is_active = true", userID).Error; err != nil {
			response.Fail(c, response.ErrUnauthorized)
			return
		}

		c.Set(CtxUserKey, &user)
		c.Set(CtxUserIDKey, userID)
		c.Next()
	}
}

// OptionalAuth behaves like RequireAuth but never fails: anonymous requests
// just proceed without a user in context. Used for public endpoints that
// show extra data to authenticated owners/admins.
func OptionalAuth(db *gorm.DB, getSecret func() string) gin.HandlerFunc {
	return func(c *gin.Context) {
		raw, err := c.Cookie("access_token")
		if err != nil || raw == "" {
			c.Next()
			return
		}
		token, err := jwt.Parse(raw, secretProvider(getSecret),
			jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
			jwt.WithExpirationRequired(),
		)
		if err != nil || !token.Valid {
			c.Next()
			return
		}
		claims := token.Claims.(jwt.MapClaims)
		sub, _ := claims["sub"].(string)
		userID, err := uuid.Parse(sub)
		if err != nil {
			c.Next()
			return
		}
		var user models.User
		if err := db.WithContext(c).First(&user, "id = ? AND is_active = true", userID).Error; err != nil {
			c.Next()
			return
		}
		c.Set(CtxUserKey, &user)
		c.Set(CtxUserIDKey, userID)
		c.Next()
	}
}

// RequireRoles authorizes by role. Must run after RequireAuth.
func RequireRoles(roles ...models.UserRole) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := CurrentUser(c)
		if user == nil {
			response.Fail(c, response.ErrUnauthorized)
			return
		}
		for _, r := range roles {
			if user.Role == r {
				c.Next()
				return
			}
		}
		response.Fail(c, response.ErrForbidden)
	}
}

func CurrentUser(c *gin.Context) *models.User {
	if v, ok := c.Get(CtxUserKey); ok {
		if u, ok := v.(*models.User); ok {
			return u
		}
	}
	return nil
}
