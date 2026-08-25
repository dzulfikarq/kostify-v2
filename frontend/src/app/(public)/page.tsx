"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { kostsApi } from "@/services/api/kosts";
import { KostCard } from "@/components/kost/KostCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/card";
import Link from "next/link";

export default function LandingPage() {
  const router = useRouter();
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["kosts", "featured"],
    queryFn: () => kostsApi.listPublic({ limit: 6 }),
  });

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-zinc-200 bg-gradient-to-b from-white to-zinc-50">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 md:text-5xl">
              Cari kost terverifikasi,
              <span className="block text-zinc-500">booking tanpa ribet</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-zinc-600 md:text-base">
              Kost telah diverifikasi admin. Booking kamar kosong, tunggu 3 hari untuk survey & deal langsung — tanpa pembayaran online.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                router.push(`/kosts?search=${encodeURIComponent(q)}`);
              }}
              className="mx-auto mt-8 flex max-w-xl gap-2 rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm"
            >
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari kota, nama kost, alamat..."
                className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
              />
              <Button type="submit" size="lg" className="shrink-0">
                Cari
              </Button>
            </form>

            <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs">
              <Link href="/kosts?city=Jakarta" className="rounded-full border bg-white px-3 py-1.5 hover:bg-zinc-50">Jakarta</Link>
              <Link href="/kosts?city=Bandung" className="rounded-full border bg-white px-3 py-1.5 hover:bg-zinc-50">Bandung</Link>
              <Link href="/kosts?gender=putri" className="rounded-full border bg-white px-3 py-1.5 hover:bg-zinc-50">Kost Putri</Link>
              <Link href="/kosts?gender=putra" className="rounded-full border bg-white px-3 py-1.5 hover:bg-zinc-50">Kost Putra</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Kost terbaru</h2>
          <Link href="/kosts" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
            Lihat semua →
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : data?.items.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((k) => (
              <KostCard key={k.id} kost={k} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed bg-white p-10 text-center text-sm text-zinc-500">
            Belum ada kost terverifikasi. Jadilah pemilik pertama!
          </div>
        )}
      </section>

      {/* Steps */}
      <section className="border-y border-zinc-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { n: "1", t: "Cari & Booking", d: "Pilih kamar available, booking langsung ter-reserve 3 hari." },
              { n: "2", t: "Survey & Deal", d: "Pemilik hubungi untuk survey. Cocok? Deal di lokasi." },
              { n: "3", t: "Kontrak Aktif", d: "Pemilik setujui booking, kontrak 1–12 bulan dibuat otomatis." },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl border bg-zinc-50 p-6">
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white">
                  {s.n}
                </div>
                <h3 className="font-semibold">{s.t}</h3>
                <p className="mt-1 text-sm text-zinc-600">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
