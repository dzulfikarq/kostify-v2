package bookings

import (
	"context"
	"log/slog"
	"time"

	"gorm.io/gorm"
)

const expireSQL = `
WITH expired AS (
    UPDATE bookings SET status = 'expired', updated_at = now()
    WHERE status IN ('pending','processing') AND expires_at <= now()
    RETURNING room_id
), freed AS (
    UPDATE rooms r SET status = 'available', updated_at = now()
    FROM expired e
    WHERE r.id = e.room_id AND r.status = 'reserved'
    RETURNING 1
)
SELECT count(*) FROM freed`

// ExpirePendingBookings atomically expires stale pending/processing bookings and
// frees their rooms in a single atomic statement.
func ExpirePendingBookings(ctx context.Context, db *gorm.DB) (int64, error) {
	var freed int64
	if err := db.WithContext(ctx).Raw(expireSQL).Scan(&freed).Error; err != nil {
		return 0, err
	}
	return freed, nil
}

func StartExpiryWorker(ctx context.Context, db *gorm.DB, interval time.Duration) {
	go func() {
		ticker := time.NewTicker(interval)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				slog.Info("expiry worker stopped")
				return
			case <-ticker.C:
				freed, err := ExpirePendingBookings(ctx, db)
				if err != nil {
					slog.Error("expiry worker failed", "error", err)
					continue
				}
				if freed > 0 {
					slog.Info("expired bookings processed", "rooms_freed", freed)
				}
			}
		}
	}()
}
