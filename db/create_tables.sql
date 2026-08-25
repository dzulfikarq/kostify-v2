CREATE TABLE users (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name          varchar(120) NOT NULL,
    email         varchar(255) NOT NULL UNIQUE,
    phone         varchar(20),
    password_hash varchar(255) NOT NULL,
    role          user_role    NOT NULL DEFAULT 'tenant',
    is_active     boolean      NOT NULL DEFAULT true,
    created_at    timestamptz  NOT NULL DEFAULT now(),
    updated_at    timestamptz  NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            uuid         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash varchar(128) NOT NULL UNIQUE,
    expires_at         timestamptz  NOT NULL,
    revoked_at         timestamptz,
    created_at         timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at) WHERE revoked_at IS NULL;

CREATE TABLE kosts (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id       uuid         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name           varchar(150) NOT NULL,
    description    text         NOT NULL DEFAULT '',
    address        varchar(500) NOT NULL DEFAULT '',
    city           varchar(100) NOT NULL,
    gender         kost_gender  NOT NULL DEFAULT 'campur',
    status         kost_status  NOT NULL DEFAULT 'pending',
    rejection_note text,
    photos         text[]       NOT NULL DEFAULT '{}',
    facilities     text[]       NOT NULL DEFAULT '{}',
    verified_at    timestamptz,
    created_at     timestamptz  NOT NULL DEFAULT now(),
    updated_at     timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX idx_kosts_city_status ON kosts(city, status);
CREATE INDEX idx_kosts_owner ON kosts(owner_id);
CREATE INDEX idx_kosts_facilities ON kosts USING GIN (facilities);

CREATE TABLE rooms (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    kost_id       uuid          NOT NULL REFERENCES kosts(id) ON DELETE CASCADE,
    room_number   varchar(20)   NOT NULL,
    price_monthly numeric(12,2) NOT NULL CHECK (price_monthly > 0),
    status        room_status   NOT NULL DEFAULT 'available',
    photos        text[]        NOT NULL DEFAULT '{}',
    facilities    text[]        NOT NULL DEFAULT '{}',
    created_at    timestamptz   NOT NULL DEFAULT now(),
    updated_at    timestamptz   NOT NULL DEFAULT now(),

    CONSTRAINT uq_rooms_number_per_kost UNIQUE (kost_id, room_number)
);

CREATE INDEX idx_rooms_status_price ON rooms(status, price_monthly);
CREATE INDEX idx_rooms_facilities ON rooms USING GIN (facilities);

CREATE TABLE bookings (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id       uuid           NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    tenant_id     uuid           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status        booking_status NOT NULL DEFAULT 'pending',
    reject_reason text,
    expires_at    timestamptz    NOT NULL,
    decided_by    uuid REFERENCES users(id) ON DELETE SET NULL,
    decided_at    timestamptz,
    created_at    timestamptz    NOT NULL DEFAULT now(),
    updated_at    timestamptz    NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_bookings_room_pending ON bookings(room_id) WHERE status = 'pending';

CREATE INDEX idx_bookings_expiry ON bookings(expires_at) WHERE status = 'pending';
CREATE INDEX idx_bookings_tenant ON bookings(tenant_id, status);
CREATE INDEX idx_bookings_room   ON bookings(room_id, status);

CREATE TABLE contracts (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id uuid            NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    room_id    uuid            NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    tenant_id  uuid            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_date date            NOT NULL,
    end_date   date            NOT NULL,
    status     contract_status NOT NULL DEFAULT 'active',
    ended_by   uuid REFERENCES users(id) ON DELETE SET NULL,
    ended_at   timestamptz,
    created_at timestamptz     NOT NULL DEFAULT now(),
    updated_at timestamptz     NOT NULL DEFAULT now(),

    CONSTRAINT ck_contract_dates CHECK (end_date > start_date)
);

CREATE INDEX idx_contracts_room_active ON contracts(room_id) WHERE status = 'active';
CREATE INDEX idx_contracts_tenant      ON contracts(tenant_id, status);