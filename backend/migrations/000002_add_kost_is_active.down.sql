DROP INDEX IF EXISTS idx_kosts_active_verified;
ALTER TABLE kosts DROP COLUMN is_active;
