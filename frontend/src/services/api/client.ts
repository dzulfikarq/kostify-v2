import axios from "axios";
import { toast } from "sonner";

const api = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
  timeout: 15000,
});

function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

// Request: attach CSRF for state-changing
api.interceptors.request.use((config) => {
  const method = (config.method || "get").toLowerCase();
  if (["post", "put", "patch", "delete"].includes(method)) {
    const token = getCsrfToken();
    if (token) config.headers.set("X-CSRF-Token", token);
  }
  return config;
});

// Response: unified error handling + refresh queue
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (v?: unknown) => void;
  reject: (e: unknown) => void;
}> = [];

function processQueue(err: unknown) {
  failedQueue.forEach((p) => (err ? p.reject(err) : p.resolve(undefined)));
  failedQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error.response?.status;
    const original = error.config as (typeof error.config & { _retry?: boolean });

    // 401 — try refresh once, single-flight
    if (status === 401 && !original?._retry) {
      const url: string = original?.url || "";
      // Never retry auth endpoints themselves (avoid loop) and me check (public pages)
      if (
        url.includes("/auth/refresh") ||
        url.includes("/auth/login") ||
        url.includes("/auth/register") ||
        url.includes("/auth/me")
      ) {
        return Promise.reject(error);
      }
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(original));
      }
      original._retry = true;
      isRefreshing = true;
      try {
        await api.post("/auth/refresh");
        processQueue(null);
        return api(original);
      } catch (refreshErr) {
        processQueue(refreshErr);
        toast.error("Sesi habis, silakan login kembali");
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    if (status === 403) {
      const msg = error.response?.data?.error?.message || "Akses ditolak";
      // Avoid toast spam for background me check
      if (!original?.url?.includes("/auth/me")) toast.error(msg);
    } else if (status === 422) {
      const details: Array<{ field: string; message: string }> =
        error.response?.data?.error?.details || [];
      if (details.length) details.forEach((d) => toast.error(`${d.field}: ${d.message}`));
      else toast.error(error.response?.data?.error?.message || "Validasi gagal");
    } else if (status === 429) {
      toast.error("Terlalu banyak permintaan, coba lagi nanti");
    } else if (status === 500) {
      toast.error("Kesalahan server, coba lagi");
    } else if (!error.response) {
      toast.error("Tidak dapat terhubung ke server");
    }

    return Promise.reject(error);
  },
);

export default api;
