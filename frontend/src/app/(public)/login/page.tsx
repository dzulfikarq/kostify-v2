"use client";

import { useState } from "react";
import { useLogin, useMe } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <Card>
        <h1 className="text-xl font-bold">Masuk</h1>
        <p className="mt-1 text-sm text-zinc-500">Gunakan akun tenant / pemilik kost</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSubmit) return;
            login.mutate({ email, password });
          }}
          className="mt-6 space-y-4"
        >
          <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} error={emailErr} placeholder="you@mail.com" />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} error={passErr} />
          {login.isError && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
              {(login.error as Error).message || "Login gagal"}
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
