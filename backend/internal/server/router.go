package server

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	goredis "github.com/redis/go-redis/v9"
	"gorm.io/gorm"

	"kostify/backend/internal/config"
	"kostify/backend/internal/http/middleware"
	"kostify/backend/internal/http/response"
	"kostify/backend/internal/models"
	"kostify/backend/internal/modules/auth"
	"kostify/backend/internal/modules/bookings"
	"kostify/backend/internal/modules/kosts"
	"kostify/backend/internal/modules/uploads"
	"kostify/backend/internal/modules/users"
	mclient "kostify/backend/internal/platform/minio"
)

type Deps struct {
	DB      *gorm.DB
	Cfg     *config.Config
	RDB     *goredis.Client
	Storage *mclient.Client
}

func NewRouter(deps Deps) *gin.Engine {
	r := gin.New()
	r.MaxMultipartMemory = 2 << 20 // 2 MB
	r.Use(middleware.RequestID(), middleware.Logger(), middleware.SecurityHeaders(), gin.Recovery())

	r.GET("/healthz", func(c *gin.Context) {
		if sqlDB, err := deps.DB.DB(); err != nil || sqlDB.Ping() != nil {
			response.Fail(c, response.NewError(http.StatusServiceUnavailable, "UNHEALTHY", "Database unreachable"))
			return
		}
		response.OK(c, gin.H{"status": "ok", "db": true}, "Healthy")
	})

	v1 := r.Group("/api/v1")

	// Auth (pre-CSRF exempt routes)
	authRepo := auth.NewRepository(deps.DB)
	authSvc := auth.NewService(authRepo, deps.Cfg)
	authH := auth.NewHandler(authSvc, deps.Cfg)

	kostRepo := kosts.NewRepository(deps.DB)
	kostSvc := kosts.NewService(kostRepo)
	kostH := kosts.NewHandler(kostSvc)

	uploadH := uploads.NewHandler(deps.Storage)

	usersRepo := users.NewRepository(deps.DB)
	usersSvc := users.NewService(usersRepo)
	usersH := users.NewHandler(usersSvc)

	bookingRepo := bookings.NewRepository(deps.DB, deps.Cfg)
	bookingSvc := bookings.NewService(bookingRepo)
	bookingH := bookings.NewHandler(bookingSvc)

	// Public
	v1.GET("/kosts", kostH.ListPublic)
	v1.GET("/kosts/:id", kostH.GetPublic)
	v1.GET("/auth/csrf", authH.CSRF)
	v1.POST("/auth/register", middleware.RateLimit(deps.RDB, "rl:auth:register", 10, time.Minute), authH.Register)
	v1.POST("/auth/login", middleware.RateLimit(deps.RDB, "rl:auth:login", 10, time.Minute), authH.Login)
	v1.POST("/auth/refresh", authH.Refresh)

	// CSRF for remaining state-changing routes
	v1.Use(func(c *gin.Context) {
		if middleware.IsCSRFExempt(c.Request.URL.Path) {
			c.Next()
			return
		}
		middleware.CSRF()(c)
	})

	v1.POST("/auth/logout", authH.Logout)
	v1.GET("/auth/me", requireAuth(deps), authH.Me)

	// Tenant bookings & contracts
	v1.POST("/bookings", requireAuth(deps), middleware.RequireRoles(models.RoleTenant), bookingH.Create)
	v1.GET("/bookings/me", requireAuth(deps), middleware.RequireRoles(models.RoleTenant), bookingH.ListMe)
	v1.PATCH("/bookings/:id/cancel", requireAuth(deps), middleware.RequireRoles(models.RoleTenant), bookingH.Cancel)
	v1.GET("/contracts/me", requireAuth(deps), middleware.RequireRoles(models.RoleTenant), bookingH.ListTenantContracts)

	// Owner
	owner := v1.Group("/owner")
	owner.Use(requireAuth(deps), middleware.RequireRoles(models.RoleOwner))
	{
		owner.GET("/kosts", kostH.ListOwner)
		owner.GET("/kosts/:id", kostH.GetOwnerKost)
		owner.POST("/kosts", kostH.CreateKost)
		owner.PATCH("/kosts/:id", kostH.UpdateKost)
		owner.GET("/kosts/:id/rooms", kostH.ListRooms)
		owner.POST("/kosts/:id/rooms", kostH.CreateRoom)
		owner.PATCH("/rooms/:id", kostH.UpdateRoom)
		owner.DELETE("/rooms/:id", kostH.DeleteRoom)

		owner.GET("/bookings", bookingH.ListOwner)
		owner.PATCH("/bookings/:id/approve", bookingH.Approve)
		owner.PATCH("/bookings/:id/reject", bookingH.Reject)
		owner.GET("/contracts", bookingH.ListOwnerContracts)
		owner.PATCH("/contracts/:id/end", bookingH.EndContract)
		owner.GET("/stats", bookingH.Stats)
	}

	// Admin
	admin := v1.Group("/admin")
	admin.Use(requireAuth(deps), middleware.RequireRoles(models.RoleSuperAdmin))
	{
			admin.GET("/kosts", kostH.ListAdmin)
		admin.PATCH("/kosts/:id", kostH.AdminUpdateKost)
		admin.DELETE("/kosts/:id", kostH.AdminDeleteKost)
		admin.PATCH("/kosts/:id/verify", kostH.VerifyKost)
		admin.PATCH("/kosts/:id/reject", kostH.RejectKost)
		admin.GET("/users", usersH.List)
		admin.POST("/users", usersH.Create)
		admin.PATCH("/users/:id", usersH.Update)
		admin.DELETE("/users/:id", usersH.Delete)
	}

	// Upload (owner + admin only, CSRF already enforced)
	// Attaches same CSRF middleware via v1.Use above.
	v1.POST("/uploads/images",
		requireAuth(deps),
		middleware.RequireRoles(models.RoleOwner, models.RoleSuperAdmin),
		uploadH.UploadImage,
	)

	return r
}

func requireAuth(deps Deps) gin.HandlerFunc {
	return middleware.RequireAuth(deps.DB, func() string {
		if deps.Cfg.JWTAccessSecret != "" {
			return deps.Cfg.JWTAccessSecret
		}
		return "dev-access-secret-change-in-production-0123456789"
	})
}
