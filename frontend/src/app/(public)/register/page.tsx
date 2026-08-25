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
  const [role, setRole] = useState<"tenant" | "owner">("tenant");
  const reg = useRegister();

  const nameErr = name && name.length < 2 ? "Minimal 2 karakter" : "";
  const emailErr = email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "Email tidak valid" : "";
  const passErr = password && password.length < 8 ? "Minimal 8 karakter" : "";

  const canSubmit = name && email && password && !nameErr && !emailErr && !passErr;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <Card>
        <h1 className="text-xl font-bold">Daftar</h1>
        <p className="mt-1 text-sm text-zinc-500">Pilih peran: pencari kost atau pemilik kost</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSubmit) return;
            reg.mutate({ name, email, password, role });
          }}
          className="mt-6 space-y-4"
        >
          <Input label="Nama" value={name} onChange={(e) => setName(e.target.value)} error={nameErr} placeholder="Nama lengkap" />
          <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} error={emailErr} placeholder="you@mail.com" />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} error={passErr} />
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
