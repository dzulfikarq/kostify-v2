package middleware

import (
	"log/slog"
	"time"

	"github.com/gin-gonic/gin"
	goredis "github.com/redis/go-redis/v9"

	"kostify/backend/internal/http/response"
)

// RateLimit is a fixed-window limiter keyed by client IP.
// ponytail: fixed window per-IP; switch to sliding window + per-account keys if precision matters.
func RateLimit(rdb *goredis.Client, prefix string, limit int, window time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		if rdb == nil {
			c.Next()
			return
		}
		key := prefix + ":" + c.ClientIP()
		pipe := rdb.TxPipeline()
		incr := pipe.Incr(c, key)
		pipe.Expire(c, key, window)
		if _, err := pipe.Exec(c); err != nil {
			// Fail closed: auth endpoints must not skip brute-force protection.
			slog.Error("rate limiter unavailable", "error", err)
			response.Fail(c, response.ErrTooManyRequests)
			return
		}
		if incr.Val() > int64(limit) {
			response.Fail(c, response.ErrTooManyRequests)
			return
		}
		c.Next()
	}
}
