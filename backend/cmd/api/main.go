package main

import (
	"context"
	"errors"
	"log"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"kostify/backend/internal/config"
	"kostify/backend/internal/database"
	"kostify/backend/internal/modules/auth"
	"kostify/backend/internal/modules/bookings"
	platformredis "kostify/backend/internal/platform/redis"
	mclient "kostify/backend/internal/platform/minio"
	"kostify/backend/internal/server"
)

func main() {
	cfg := config.Load()

	setupLogger(cfg.AppEnv)

	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("database: %v", err)
	}
	defer func() { _ = db.Close() }()

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	rdb := platformredis.New(cfg)
	defer func() { _ = rdb.Close() }()

	storage, err := mclient.New(cfg)
	if err != nil {
		slog.Warn("minio init failed", "error", err)
	}

	// Seed super admin (idempotent).
	{
		repo := auth.NewRepository(db.GORM)
		svc := auth.NewService(repo, cfg)
		if err := svc.EnsureSuperAdmin(ctx); err != nil {
			slog.Warn("super admin seed failed", "error", err)
		}
	}

	// Background worker: auto-expire pending bookings (business rule).
	bookings.StartExpiryWorker(ctx, db.GORM, cfg.WorkerInterval)

	router := server.NewRouter(server.Deps{DB: db.GORM, Cfg: cfg, RDB: rdb, Storage: storage})
	srv := &http.Server{
		Addr:         ":" + cfg.AppPort,
		Handler:      router,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		slog.Info("api listening", "port", cfg.AppPort, "env", cfg.AppEnv)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("server: %v", err)
		}
	}()

	<-ctx.Done()
	slog.Info("shutting down")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		slog.Error("graceful shutdown failed", "error", err)
	}
}

func setupLogger(env string) {
	level := slog.LevelInfo
	if env == "development" {
		level = slog.LevelDebug
	}
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: level})))
}
