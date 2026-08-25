"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/services/api/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => authApi.me(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: (body: { email: string; password: string }) => authApi.login(body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["me"] });
      toast.success("Login berhasil");
      router.push("/");
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (body: { name: string; email: string; password: string; role: string; gender?: string }) =>
      authApi.register(body),
    // Jangan auto-redirect: user harus verifikasi email dulu (halaman register
    // menampilkan notice + link dev). Router push dihapus.
    onSuccess: () => {},
  });
}

export function useLogout() {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      qc.setQueryData(["me"], null);
      qc.clear();
      toast.success("Logout berhasil");
      router.push("/login");
    },
  });
}
