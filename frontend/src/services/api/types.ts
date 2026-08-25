export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "super_admin" | "owner" | "tenant";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Kost {
  id: string;
  owner_id: string;
  owner?: User;
  name: string;
  description: string;
  address: string;
  city: string;
  gender: "putra" | "putri" | "campur";
  status: "pending" | "verified" | "rejected";
  rejection_note?: string | null;
  photos: string[];
  facilities: string[];
  verified_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  kost_id: string;
  room_number: string;
  price_monthly: number;
  status: "available" | "reserved" | "occupied" | "maintenance";
  photos: string[];
  facilities: string[];
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  room_id: string;
  room?: Room;
  tenant_id: string;
  tenant?: User;
  status: "pending" | "approved" | "rejected" | "expired" | "cancelled";
  reject_reason?: string | null;
  expires_at: string;
  decided_by?: string | null;
  decided_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: string;
  booking_id: string;
  room_id: string;
  room?: Room;
  tenant_id: string;
  tenant?: User;
  start_date: string;
  end_date: string;
  status: "active" | "ended";
  ended_by?: string | null;
  ended_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface Paginated<T> {
  items: T[];
  pagination: Pagination;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message: string;
}
