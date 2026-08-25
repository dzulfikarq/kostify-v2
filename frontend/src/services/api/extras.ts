import api from "./client";
import type { Conversation, ChatMessage, KostAssignment, KostEvent, User } from "./types";

export const chatApi = {
  start: (withUserId: string) =>
    api.post<{ data: Conversation }>("/chat/start", { with_user_id: withUserId }).then((r) => r.data.data),
  list: () =>
    api.get<{ data: { items: Conversation[] } }>("/chat/conversations").then((r) => r.data.data.items),
  unread: () =>
    api.get<{ data: { unread: number } }>("/chat/unread").then((r) => r.data.data.unread),
  messages: (convId: string) =>
    api.get<{ data: { items: ChatMessage[] } }>(`/chat/conversations/${convId}/messages`).then((r) => r.data.data.items),
  send: (convId: string, body: string) =>
    api.post<{ data: ChatMessage }>(`/chat/conversations/${convId}/messages`, { body }).then((r) => r.data.data),
};

export const surveyApi = {
  assign: (kostId: string, teknisiId: string, scheduledAt?: string) =>
    api.post<{ data: KostAssignment }>(`/admin/kosts/${kostId}/assign`, {
      teknisi_id: teknisiId,
      scheduled_at: scheduledAt,
    }).then((r) => r.data.data),
  listAssignments: () =>
    api.get<{ data: { items: KostAssignment[] } }>("/teknisi/assignments").then((r) => r.data.data.items),
  listAssignmentsAdmin: () =>
    api.get<{ data: { items: KostAssignment[] } }>("/admin/assignments").then((r) => r.data.data.items),
  decide: (id: string, decision: "approved" | "rejected", note: string) =>
    api.patch<{ data: KostAssignment }>(`/teknisi/assignments/${id}/decide`, { decision, note }).then((r) => r.data.data),
  listTeknisi: () =>
    api.get<{ data: { items: User[] } }>("/admin/users", { params: { role: "teknisi", limit: 100 } }).then((r) => r.data.data.items),
};

export const eventsApi = {
  list: () =>
    api.get<{ data: { items: KostEvent[] } }>("/events").then((r) => r.data.data.items),
  create: (input: { title: string; kost_id?: string; teknisi_id?: string; scheduled_at: string; notes?: string }) =>
    api.post<{ data: KostEvent }>("/admin/events", input).then((r) => r.data.data),
  remove: (id: string) => api.delete(`/admin/events/${id}`),
};
