package config

import (
	"log"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	AppEnv string
	AppPort string

	DatabaseURL string

	JWTAccessSecret  string
	JWTRefreshSecret string
	AccessTokenTTL   time.Duration
	RefreshTokenTTL  time.Duration

	BookingExpiryHours int
	WorkerInterval     time.Duration

	RedisAddr string

	MinioEndpoint  string
	MinioAccessKey string
	MinioSecretKey string
	MinioBucket    string
	MinioUseSSL    bool

	FrontendURL string

	AdminEmail    string
	AdminPassword string
	CookieSecure  bool
}

func Load() *Config {
	_ = godotenv.Load()

	cfg := &Config{
		AppEnv:         getEnv("APP_ENV", "development"),
		AppPort:        getEnv("APP_PORT", "8080"),
		DatabaseURL: getEnv("DATABASE_URL", "postgres://kostify:kostify@localhost:5432/kostify?sslmode=disable"),

		JWTAccessSecret:  getEnv("JWT_ACCESS_SECRET", ""),
		JWTRefreshSecret: getEnv("JWT_REFRESH_SECRET", ""),
		AccessTokenTTL:   15 * time.Minute,
		RefreshTokenTTL:  7 * 24 * time.Hour,

		BookingExpiryHours: getEnvInt("BOOKING_EXPIRY_HOURS", 72),
		WorkerInterval:     time.Duration(getEnvInt("WORKER_INTERVAL_SECONDS", 60)) * time.Second,

		RedisAddr: getEnv("REDIS_ADDR", "localhost:6379"),

		MinioEndpoint:  getEnv("MINIO_ENDPOINT", "localhost:9000"),
		MinioAccessKey: getEnv("MINIO_ACCESS_KEY", ""),
		MinioSecretKey: getEnv("MINIO_SECRET_KEY", ""),
		MinioBucket:    getEnv("MINIO_BUCKET", "kostify"),
		MinioUseSSL:    getEnv("MINIO_USE_SSL", "false") == "true",

		FrontendURL: getEnv("FRONTEND_URL", "http://localhost:3000"),

		AdminEmail:    getEnv("ADMIN_EMAIL", "admin@kostify.local"),
		AdminPassword: getEnv("ADMIN_PASSWORD", "Admin123!"),
		CookieSecure:  getEnv("COOKIE_SECURE", "") == "true" || getEnv("APP_ENV", "development") == "production",
	}

	if cfg.AppEnv == "production" {
		if cfg.JWTAccessSecret == "" || cfg.JWTRefreshSecret == "" {
			log.Fatal("JWT secrets are required in production")
		}
		if cfg.AdminPassword == "Admin123!" {
			log.Println("WARNING: default ADMIN_PASSWORD in production — change it")
		}
	}
	return cfg
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return fallback
}
