"use client";

import { useState } from "react";
import { useLogin, useMe } from "@/hooks/useAuth";
import { authApi } from "@/services/api/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notVerified, setNotVerified] = useState(false);
  const [devLink, setDevLink] = useState("");
  const login = useLogin();
  const { data: me } = useMe();
  const router = useRouter();

  if (me) {
    router.replace("/");
    return null;
  }

  const emailErr = email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "Email tidak valid" : "";
  const passErr = password && password.length < 8 ? "Minimal 8 karakter" : "";

  const canSubmit = email && password && !emailErr && !passErr;

  const err = login.error as (Error & { response?: { data?: { error?: { code?: string; message?: string } } } }) | null;
  const errCode = err?.response?.data?.error?.code;

  async function resend() {
    try {
      const r = await authApi.resendVerification(email);
      setDevLink(r.data?.verify_link || "");
      toast.success("Link verifikasi baru dikirim");
    } catch {
      toast.error("Gagal kirim ulang link");
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <Card>
        <h1 className="text-xl font-bold">Masuk</h1>
        <p className="mt-1 text-sm text-zinc-500">Gunakan akun tenant / pemilik kost</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSubmit) return;
            setNotVerified(false);
            setDevLink("");
            login.mutate({ email, password });
          }}
          className="mt-6 space-y-4"
        >
          <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} error={emailErr} placeholder="you@mail.com" />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} error={passErr} />
          {login.isError && errCode === "EMAIL_NOT_VERIFIED" && (
            <div className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
              <p>{err?.response?.data?.error?.message || "Email belum diverifikasi."}</p>
              <button type="button" onClick={resend} className="mt-1 font-semibold underline">
                Kirim ulang link verifikasi
              </button>
              {devLink && (
                <a href={devLink} className="mt-1 block break-all text-xs font-medium text-[#8550e6]">
                  (Mode dev) Buka link verifikasi →
                </a>
              )}
            </div>
          )}
          {login.isError && errCode !== "EMAIL_NOT_VERIFIED" && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
              {err?.response?.data?.error?.message || "Login gagal"}
            </p>
          )}
          <Button type="submit" disabled={!canSubmit || login.isPending} className="w-full">
            {login.isPending ? "Memproses..." : "Masuk"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-zinc-500">
          Belum punya akun? <Link href="/register" className="font-medium text-zinc-900 underline">Daftar</Link>
        </p>
      </Card>
    </div>
  );
}
