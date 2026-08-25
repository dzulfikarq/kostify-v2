package redis

import (
	"context"
	"log/slog"
	"time"

	goredis "github.com/redis/go-redis/v9"

	"kostify/backend/internal/config"
)

func New(cfg *config.Config) *goredis.Client {
	client := goredis.NewClient(&goredis.Options{
		Addr: cfg.RedisAddr,
	})
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	if err := client.Ping(ctx).Err(); err != nil {
		slog.Warn("redis unavailable", "addr", cfg.RedisAddr, "error", err)
	} else {
		slog.Info("redis connected", "addr", cfg.RedisAddr)
	}
	return client
}
