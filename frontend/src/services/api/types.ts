export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "super_admin" | "owner" | "tenant" | "teknisi";
  gender?: string;
  email_verified?: boolean;
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
  province?: string | null;
  regency?: string | null;
  district?: string | null;
  village?: string | null;
  postal_code?: string | null;
  gender: "putra" | "putri" | "campur";
  status: "pending" | "verified" | "rejected";
  is_active: boolean;
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
  luas?: number;
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
  survey_date?: string | null;
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

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  link: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface KostAssignment {
  id: string;
  kost_id: string;
  kost?: Kost;
  teknisi_id: string;
  teknisi?: User;
  status: "assigned" | "surveying" | "approved" | "rejected";
  decision?: "approved" | "rejected" | null;
  note?: string | null;
  assigned_by?: string | null;
  decided_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender?: User;
  body: string;
  read_at?: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  participant_a: string;
  participant_b: string;
  last_message?: string | null;
  last_message_at?: string | null;
  other_id: string;
  other_name: string;
  other_role: string;
  unread_count: number;
  updated_at: string;
}

export interface KostEvent {
  id: string;
  title: string;
  event_type: string;
  kost_id?: string | null;
  kost?: Kost;
  owner_id?: string | null;
  owner?: User;
  teknisi_id?: string | null;
  teknisi?: User;
  booking_id?: string | null;
  scheduled_at: string;
  notes: string;
  created_at: string;
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
