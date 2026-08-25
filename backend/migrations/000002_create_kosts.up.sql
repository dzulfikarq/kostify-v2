-- Migration: Create kosts table (types user_role, kost_gender, kost_status already exist from prior migration)
-- This migration assumes: user_role, kost_gender, kost_status enums already exist
BEGIN;

CREATE TABLE IF NOT EXISTS kosts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name varchar(150) NOT NULL,
    description text NOT NULL DEFAULT '',
    address varchar(500) NOT NULL DEFAULT '',
    city varchar(100) NOT NULL,
    gender kost_gender NOT NULL DEFAULT 'campur',
    status kost_status NOT NULL DEFAULT 'pending',
    rejection_note text,
    photos text[] NOT NULL DEFAULT '{}',
    facilities text[] NOT NULL DEFAULT '{}',
    verified_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_kosts_city_status ON kosts(city, status);
CREATE INDEX idx_kosts_owner ON kosts(owner_id);
CREATE INDEX idx_kosts_facilities ON kosts USING GIN (facilities);

COMMIT;