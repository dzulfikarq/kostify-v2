import api from "./client";
import type { Kost, Paginated, Room } from "./types";

export type KostListParams = {
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
  gender?: string;
  facilities?: string;
  min_price?: number;
  max_price?: number;
  sort?: string;
  order?: string;
};

export const kostsApi = {
  listPublic: (params: KostListParams) =>
    api.get<{ data: Paginated<Kost> }>("/kosts", { params }).then((r) => r.data.data),
  getPublic: (id: string) =>
    api.get<{ data: { kost: Kost; rooms: Room[] } }>(`/kosts/${id}`).then((r) => r.data.data),
};
