import api from "./client";
import type { Kost, Paginated, Room, Booking, Contract, User, Notification } from "./types";

export const dashboardApi = {
  // stats
  stats: () => api.get<{ data: Record<string, unknown> }>("/owner/stats").then((r) => r.data.data),

  // owner kosts
  listOwnerKosts: (params?: Record<string, unknown>) =>
    api.get<{ data: Paginated<Kost> }>("/owner/kosts", { params }).then((r) => r.data.data),
  getOwnerKost: (id: string) => api.get<{ data: Kost }>(`/owner/kosts/${id}`).then((r) => r.data.data),
  createKost: (body: Partial<Kost>) => api.post("/owner/kosts", body).then((r) => r.data),
  updateKost: (id: string, body: Partial<Kost>) => api.patch(`/owner/kosts/${id}`, body).then((r) => r.data),

  // rooms
  listRooms: (kostId: string) => api.get<{ data: Room[] }>(`/owner/kosts/${kostId}/rooms`).then((r) => r.data.data),
  createRoom: (kostId: string, body: Partial<Room>) =>
    api.post(`/owner/kosts/${kostId}/rooms`, body).then((r) => r.data),
  updateRoom: (roomId: string, body: Partial<Room>) => api.patch(`/owner/rooms/${roomId}`, body).then((r) => r.data),
  deleteRoom: (roomId: string) => api.delete(`/owner/rooms/${roomId}`),

  // bookings owner
  listOwnerBookings: (params?: Record<string, unknown>) =>
    api.get<{ data: Paginated<Booking> }>("/owner/bookings", { params }).then((r) => r.data.data),
  approveBooking: (id: string, body: { start_date: string; duration_months: number }) =>
    api.patch(`/owner/bookings/${id}/approve`, body).then((r) => r.data),
  rejectBooking: (id: string, body: { reason: string }) =>
    api.patch(`/owner/bookings/${id}/reject`, body).then((r) => r.data),

  // contracts owner
  listOwnerContracts: (params?: Record<string, unknown>) =>
    api.get<{ data: Paginated<Contract> }>("/owner/contracts", { params }).then((r) => r.data.data),
  endContract: (id: string) => api.patch(`/owner/contracts/${id}/end`).then((r) => r.data),

  // admin kosts CRUD
  listAdminKosts: (params?: Record<string, unknown>) =>
    api.get<{ data: Paginated<Kost> }>("/admin/kosts", { params }).then((r) => r.data.data),
  createAdminKost: (body: Partial<Kost>) => api.post("/admin/kosts", body).then((r) => r.data),
  verifyKost: (id: string) => api.patch(`/admin/kosts/${id}/verify`).then((r) => r.data),
  rejectKost: (id: string, note: string) => api.patch(`/admin/kosts/${id}/reject`, { note }).then((r) => r.data),
  updateAdminKost: (id: string, body: Partial<Kost>) => api.patch(`/admin/kosts/${id}`, body).then((r) => r.data),
  deleteAdminKost: (id: string) => api.delete(`/admin/kosts/${id}`).then((r) => r.data),
  toggleKostActive: (id: string, is_active: boolean) => api.patch(`/admin/kosts/${id}/active`, { is_active }).then((r) => r.data),

  // admin users CRUD
  listUsers: (params?: Record<string, unknown>) =>
    api.get<{ data: Paginated<User> }>("/admin/users", { params }).then((r) => r.data.data),
  createUser: (body: { name: string; email: string; password: string; role: string; phone?: string }) =>
    api.post("/admin/users", body).then((r) => r.data),
  updateUser: (id: string, body: { is_active?: boolean; role?: string }) =>
    api.patch(`/admin/users/${id}`, body).then((r) => r.data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`).then((r) => r.data),

  // upload
  uploadImage: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post<{ data: { url: string } }>("/uploads/images", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data.data.url);
  },

  // profile
  updateProfile: (body: { name?: string; phone?: string; gender?: string }) =>
    api.patch("/users/me", body).then((r) => r.data),

  // notifications
  listNotifications: () =>
    api.get<{ data: { items: Notification[]; unread: number } }>("/notifications", { params: { limit: 30 } }).then((r) => r.data.data),
  markNotificationRead: (id: string) =>
    api.patch(`/notifications/${id}/read`).then((r) => r.data),
};
