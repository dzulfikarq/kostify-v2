"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { authApi } from "@/services/api/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";

function VerifyContent() {
  const sp = useSearchParams();
  const token = sp.get("token") || "";
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("Token tidak ditemukan di link.");
      return;
    }
    authApi
      .verifyEmail(token)
      .then((r) => {
        setState("ok");
        setMessage(r.message || "Email berhasil diverifikasi!");
      })
      .catch((e) => {
        setState("error");
        setMessage(e.response?.data?.error?.message || "Verifikasi gagal");
      });
  }, [token]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <Card className="text-center">
        {state === "loading" && (
          <>
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#8550e6] border-t-transparent" />
            <p className="text-sm text-zinc-500">Memverifikasi email...</p>
          </>
        )}
        {state === "ok" && (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-2xl">✅</div>
            <h1 className="text-lg font-bold">Email Terverifikasi!</h1>
            <p className="mt-2 text-sm text-zinc-600">{message}</p>
            <div className="mt-6">
              <Link href="/login">
                <Button className="w-full">Login Sekarang</Button>
              </Link>
            </div>
          </>
        )}
        {state === "error" && (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl">❌</div>
            <h1 className="text-lg font-bold">Verifikasi Gagal</h1>
            <p className="mt-2 text-sm text-zinc-600">{message}</p>
            <div className="mt-6">
              <Link href="/login">
                <Button variant="outline" className="w-full">Kembali ke Login</Button>
              </Link>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-zinc-500">Memuat...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
