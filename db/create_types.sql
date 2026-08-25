CREATE TYPE user_role AS ENUM ('super_admin', 'owner', 'tenant');
CREATE TYPE kost_gender AS ENUM ('putra', 'putri', 'campur');
CREATE TYPE kost_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE room_status AS ENUM ('available', 'reserved', 'occupied', 'maintenance');
CREATE TYPE booking_status AS ENUM ('pending', 'approved', 'rejected', 'expired', 'cancelled');
CREATE TYPE contract_status AS ENUM ('active', 'ended');