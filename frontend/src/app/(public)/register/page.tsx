"use client";

import { useState } from "react";
import { useRegister } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("");
  const [role, setRole] = useState<"tenant" | "owner">("tenant");
  const reg = useRegister();

  const nameErr = name && name.length < 2 ? "Minimal 2 karakter" : "";
  const emailErr = email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "Email tidak valid" : "";
  const passErr = password && password.length < 8 ? "Minimal 8 karakter" : "";

  const canSubmit = name && email && password && !nameErr && !emailErr && !passErr;

  if (reg.isSuccess) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
        <Card className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f5f0ff] text-2xl">📧</div>
          <h1 className="text-lg font-bold">Cek Email Anda!</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Link verifikasi telah dikirim ke <strong>{email}</strong>.
            Silakan verifikasi email sebelum login.
          </p>
          {typeof reg.data === "object" && reg.data !== null && "verify_link" in (reg.data as Record<string, unknown>) && (
            <a
              href={String((reg.data as Record<string, unknown>).verify_link)}
              className="mt-3 inline-block rounded-xl bg-[#f5f0ff] px-3 py-2 text-xs font-medium text-[#8550e6] break-all"
            >
              (Mode dev) Buka link verifikasi →
            </a>
          )}
          <div className="mt-6">
            <Link href="/login">
              <Button className="w-full">Ke Halaman Masuk</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <Card>
        <h1 className="text-xl font-bold">Daftar</h1>
        <p className="mt-1 text-sm text-zinc-500">Pilih peran: pencari kost atau pemilik kost</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSubmit) return;
            reg.mutate({ name, email, password, role, gender });
          }}
          className="mt-6 space-y-4"
        >
          <Input label="Nama" value={name} onChange={(e) => setName(e.target.value)} error={nameErr} placeholder="Nama lengkap" />
          <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} error={emailErr} placeholder="you@mail.com" />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} error={passErr} />
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-zinc-700">Jenis Kelamin</span>
            <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm">
              <option value="">Pilih (opsional)</option>
              <option value="laki-laki">Laki-laki</option>
              <option value="perempuan">Perempuan</option>
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-zinc-700">Peran</span>
            <select value={role} onChange={(e) => setRole(e.target.value as never)} className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm">
              <option value="tenant">Pencari Kost</option>
              <option value="owner">Pemilik Kost</option>
            </select>
          </label>
          {reg.isError && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">Registrasi gagal</p>}
          <Button type="submit" disabled={!canSubmit || reg.isPending} className="w-full">
            {reg.isPending ? "Memproses..." : "Daftar"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-zinc-500">
          Sudah punya akun? <Link href="/login" className="font-medium text-zinc-900 underline">Masuk</Link>
        </p>
      </Card>
    </div>
  );
}
