-- Fitur baru: gender user, teknisi, verifikasi email, survey booking,
-- assignment teknisi, chat, event.

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'teknisi';

ALTER TABLE users ADD COLUMN IF NOT EXISTS gender varchar(20) NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false;
-- User yang sudah ada sebelum fitur ini dianggap sudah verifikasi email.
UPDATE users SET email_verified = true;

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS survey_date date;

CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token      varchar(128) NOT NULL UNIQUE,
    expires_at timestamptz NOT NULL,
    used_at    timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_evt_user ON email_verification_tokens(user_id);

CREATE TABLE IF NOT EXISTS kost_assignments (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    kost_id     uuid NOT NULL REFERENCES kosts(id) ON DELETE CASCADE,
    teknisi_id  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status      varchar(20) NOT NULL DEFAULT 'assigned',
    decision    varchar(20),
    note        text,
    assigned_by uuid REFERENCES users(id) ON DELETE SET NULL,
    decided_at  timestamptz,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_assignment_status CHECK (status IN ('assigned','surveying','approved','rejected')),
    CONSTRAINT ck_assignment_decision CHECK (decision IS NULL OR decision IN ('approved','rejected'))
);
CREATE INDEX IF NOT EXISTS idx_assignment_teknisi ON kost_assignments(teknisi_id, status);
CREATE INDEX IF NOT EXISTS idx_assignment_kost ON kost_assignments(kost_id);

CREATE TABLE IF NOT EXISTS conversations (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_a uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participant_b uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_conversation_pair UNIQUE (participant_a, participant_b)
);
CREATE INDEX IF NOT EXISTS idx_conv_a ON conversations(participant_a);
CREATE INDEX IF NOT EXISTS idx_conv_b ON conversations(participant_b);

CREATE TABLE IF NOT EXISTS messages (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body            text NOT NULL,
    read_at         timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, created_at);

CREATE TABLE IF NOT EXISTS events (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title        varchar(200) NOT NULL,
    event_type   varchar(30) NOT NULL DEFAULT 'survey',
    kost_id      uuid REFERENCES kosts(id) ON DELETE CASCADE,
    owner_id     uuid REFERENCES users(id) ON DELETE CASCADE,
    teknisi_id   uuid REFERENCES users(id) ON DELETE SET NULL,
    booking_id   uuid REFERENCES bookings(id) ON DELETE CASCADE,
    scheduled_at timestamptz NOT NULL,
    notes        text NOT NULL DEFAULT '',
    created_by   uuid REFERENCES users(id) ON DELETE SET NULL,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_events_teknisi ON events(teknisi_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_events_owner ON events(owner_id, scheduled_at);
