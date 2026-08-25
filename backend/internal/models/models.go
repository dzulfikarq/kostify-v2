package models

import (
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
)

type UserRole string

const (
	RoleSuperAdmin UserRole = "super_admin"
	RoleOwner      UserRole = "owner"
	RoleTenant     UserRole = "tenant"
)

type User struct {
	ID           uuid.UUID `gorm:"type:uuid;default:gen_random_uuid()" json:"id"`
	Name         string    `gorm:"size:120;not null" json:"name"`
	Email        string    `gorm:"size:255;not null;uniqueIndex" json:"email"`
	Phone        string    `gorm:"size:20" json:"phone"`
	PasswordHash string    `gorm:"size:255;not null" json:"-"`
	Role         UserRole  `gorm:"type:user_role;not null;default:'tenant'" json:"role"`
	IsActive     bool      `gorm:"not null;default:true" json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (User) TableName() string { return "users" }

type Session struct {
	ID               uuid.UUID `gorm:"type:uuid;default:gen_random_uuid()" json:"id"`
	UserID           uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	RefreshTokenHash string    `gorm:"size:128;not null;uniqueIndex" json:"-"`
	ExpiresAt        time.Time `json:"expires_at"`
	RevokedAt        *time.Time
	CreatedAt        time.Time `json:"created_at"`
}

func (Session) TableName() string { return "sessions" }

type KostGender string

const (
	GenderPutra  KostGender = "putra"
	GenderPutri  KostGender = "putri"
	GenderCampur KostGender = "campur"
)

type KostStatus string

const (
	KostPending  KostStatus = "pending"
	KostVerified KostStatus = "verified"
	KostRejected KostStatus = "rejected"
)

type RoomStatus string

const (
	RoomAvailable   RoomStatus = "available"
	RoomReserved    RoomStatus = "reserved"
	RoomOccupied    RoomStatus = "occupied"
	RoomMaintenance RoomStatus = "maintenance"
)

type Kost struct {
	ID            uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid()" json:"id"`
	OwnerID       uuid.UUID      `gorm:"type:uuid;not null" json:"owner_id"`
	Owner         User           `gorm:"foreignKey:OwnerID" json:"owner,omitempty"`
	Name          string         `gorm:"size:150;not null" json:"name"`
	Description   string         `gorm:"type:text;not null;default:''" json:"description"`
	Address       string         `gorm:"size:500;not null;default:''" json:"address"`
	City          string         `gorm:"size:100;not null" json:"city"`
	Province      *string        `gorm:"size:100" json:"province,omitempty"`
	Regency       *string        `gorm:"size:100" json:"regency,omitempty"`
	District      *string        `gorm:"size:100" json:"district,omitempty"`
	Village       *string        `gorm:"size:100" json:"village,omitempty"`
	PostalCode    *string        `gorm:"size:10" json:"postal_code,omitempty"`
	Gender        KostGender     `gorm:"type:kost_gender;not null;default:'campur'" json:"gender"`
	Status        KostStatus     `gorm:"type:kost_status;not null;default:'pending'" json:"status"`
	IsActive      bool           `gorm:"not null;default:true" json:"is_active"`
	RejectionNote *string        `gorm:"type:text" json:"rejection_note,omitempty"`
	Photos        pq.StringArray `gorm:"type:text[];default:'{}'" json:"photos"`
	Facilities    pq.StringArray `gorm:"type:text[];default:'{}'" json:"facilities"`
	VerifiedAt    *time.Time     `json:"verified_at,omitempty"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
}

func (Kost) TableName() string { return "kosts" }

type Room struct {
	ID           uuid.UUID     `gorm:"type:uuid;default:gen_random_uuid()" json:"id"`
	KostID       uuid.UUID     `gorm:"type:uuid;not null" json:"kost_id"`
	Kost         Kost          `gorm:"foreignKey:KostID" json:"-"`
	RoomNumber   string        `gorm:"size:20;not null" json:"room_number"`
	PriceMonthly float64       `gorm:"type:numeric(12,2);not null" json:"price_monthly"`
	Luas         float64       `gorm:"type:numeric(6,2);not null;default:0" json:"luas"`
	Status       RoomStatus    `gorm:"type:room_status;not null;default:'available'" json:"status"`
	Photos       pq.StringArray `gorm:"type:text[];default:'{}'" json:"photos"`
	Facilities   pq.StringArray `gorm:"type:text[];default:'{}'" json:"facilities"`
	CreatedAt    time.Time     `json:"created_at"`
	UpdatedAt    time.Time     `json:"updated_at"`
}

func (Room) TableName() string { return "rooms" }

type BookingStatus string

const (
	BookingPending   BookingStatus = "pending"
	BookingApproved  BookingStatus = "approved"
	BookingRejected  BookingStatus = "rejected"
	BookingExpired   BookingStatus = "expired"
	BookingCancelled BookingStatus = "cancelled"
)

type ContractStatus string

const (
	ContractActive ContractStatus = "active"
	ContractEnded  ContractStatus = "ended"
)

type Booking struct {
	ID           uuid.UUID     `gorm:"type:uuid;default:gen_random_uuid()" json:"id"`
	RoomID       uuid.UUID     `gorm:"type:uuid;not null" json:"room_id"`
	Room         Room          `gorm:"foreignKey:RoomID" json:"room,omitempty"`
	TenantID     uuid.UUID     `gorm:"type:uuid;not null" json:"tenant_id"`
	Tenant       User          `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
	Status       BookingStatus `gorm:"type:booking_status;not null;default:'pending'" json:"status"`
	RejectReason *string       `gorm:"type:text" json:"reject_reason,omitempty"`
	ExpiresAt    time.Time     `json:"expires_at"`
	DecidedBy    *uuid.UUID    `gorm:"type:uuid" json:"decided_by,omitempty"`
	DecidedAt    *time.Time    `json:"decided_at,omitempty"`
	CreatedAt    time.Time     `json:"created_at"`
	UpdatedAt    time.Time     `json:"updated_at"`
}

func (Booking) TableName() string { return "bookings" }

type Contract struct {
	ID        uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid()" json:"id"`
	BookingID uuid.UUID      `gorm:"type:uuid;not null;uniqueIndex" json:"booking_id"`
	Booking   Booking        `gorm:"foreignKey:BookingID" json:"booking,omitempty"`
	RoomID    uuid.UUID      `gorm:"type:uuid;not null" json:"room_id"`
	Room      Room           `gorm:"foreignKey:RoomID" json:"room,omitempty"`
	TenantID  uuid.UUID      `gorm:"type:uuid;not null" json:"tenant_id"`
	Tenant    User           `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
	StartDate time.Time      `gorm:"type:date;not null" json:"start_date"`
	EndDate   time.Time      `gorm:"type:date;not null" json:"end_date"`
	Status    ContractStatus `gorm:"type:contract_status;not null;default:'active'" json:"status"`
	EndedBy   *uuid.UUID     `gorm:"type:uuid" json:"ended_by,omitempty"`
	EndedAt   *time.Time     `json:"ended_at,omitempty"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
}

func (Contract) TableName() string { return "contracts" }

type Notification struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid()" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	Title     string    `gorm:"size:200;not null" json:"title"`
	Body      string    `gorm:"type:text;not null;default:''" json:"body"`
	Link      string    `gorm:"size:300;not null;default:''" json:"link"`
	IsRead    bool      `gorm:"not null;default:false" json:"is_read"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (Notification) TableName() string { return "notifications" }
