import api from "./client";
import type { Booking, Paginated } from "./types";

export const bookingsApi = {
  create: (room_id: string) => api.post("/bookings", { room_id }),
  listMe: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get<{ data: Paginated<Booking> }>("/bookings/me", { params }).then((r) => r.data.data),
  cancel: (id: string) => api.patch(`/bookings/${id}/cancel`),
};
