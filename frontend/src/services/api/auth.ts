import api from "./client";
import type { User } from "./types";

export const authApi = {
  csrf: () => api.get<{ csrf_token: string }>("/auth/csrf").then((r) => r.data),
  register: (body: { name: string; email: string; password: string; role?: string; phone?: string; gender?: string }) =>
    api.post("/auth/register", body).then((r) => r.data),
  verifyEmail: (token: string) => api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`).then((r) => r.data),
  resendVerification: (email: string) => api.post("/auth/resend-verification", { email }).then((r) => r.data),
  login: (body: { email: string; password: string }) => api.post<{ data: User }>("/auth/login", body),
  logout: () => api.post("/auth/logout"),
  me: () => api.get<{ data: User }>("/auth/me").then((r) => r.data.data),
  refresh: () => api.post("/auth/refresh"),
};
