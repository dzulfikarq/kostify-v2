-- Add is_active to kosts for admin active/nonactive toggle
ALTER TABLE kosts ADD COLUMN is_active boolean NOT NULL DEFAULT true;
CREATE INDEX idx_kosts_active_verified ON kosts(is_active, status) WHERE status = 'verified';
