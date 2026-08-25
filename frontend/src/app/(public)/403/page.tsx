"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="text-7xl font-bold text-[#8550e6]">403</p>
        <h1 className="mt-4 text-xl font-semibold">Akses Ditolak</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Anda tidak memiliki izin untuk mengakses halaman ini.
        </p>
        <Link href="/" className="mt-6 inline-block">
          <Button className="shadow-sm">Kembali ke Beranda</Button>
        </Link>
      </div>
    </div>
  );
}
