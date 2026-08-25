"use client";

import { useQuery } from "@tanstack/react-query";
import { useMe } from "@/hooks/useAuth";
import { dashboardApi } from "@/services/api/dashboard";
import { Card, Skeleton } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts";

const VIOLET = "#8550e6";
const VIOLET_LIGHT = "#ede5fe";
const EMERALD = "#10b981";
const AMBER = "#f59e0b";
const ZINC = "#71717a";

export default function DashboardPage() {
  const { data: user } = useMe();
  const isOwner = user?.role === "owner";
  const isAdmin = user?.role === "super_admin";

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => dashboardApi.stats(),
    enabled: isOwner,
  });

  const { data: pendingKosts } = useQuery({
    queryKey: ["admin-pending-count"],
    queryFn: () => dashboardApi.listAdminKosts({ status: "pending", limit: 1 }),
    enabled: isAdmin,
  });

  const { data: recentBookings } = useQuery({
    queryKey: ["recent-bookings"],
    queryFn: () => dashboardApi.listOwnerBookings({ limit: 5 }),
    enabled: isOwner,
  });

  if (!user) return <div className="p-8 text-center text-sm text-zinc-500">Memuat...</div>;
  if (!isOwner && !isAdmin) return <div className="p-8 text-center text-sm">Akses dashboard hanya untuk pemilik / admin</div>;

  if (isAdmin) {
    return (
      <div className="space-y-6 p-2 lg:p-6">
        <div className="rounded-[2rem] bg-gradient-to-br from-[#8550e6] via-[#7c3aed] to-[#4f46e5] p-8 text-white">
          <h1 className="text-3xl font-bold tracking-tight">Halo, {user.name} ✨</h1>
          <p className="mt-2 max-w-xl text-sm text-violet-100">Panel super admin — verifikasi kost baru dan kelola pengguna untuk menjaga kepercayaan platform.</p>
          <div className="mt-6 flex gap-3">
            <Link href="/dashboard/verification"><Button variant="outline" className="bg-white text-zinc-900 hover:bg-zinc-50">Verifikasi Kost</Button></Link>
            <Link href="/dashboard/users"><Button variant="ghost" className="bg-white/10 text-white hover:bg-white/20 border border-white/20">Kelola Users</Button></Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-0 bg-white shadow-sm">
            <p className="text-xs font-medium tracking-widest text-zinc-500 uppercase">Menunggu Verifikasi</p>
            <p className="mt-2 text-3xl font-bold">{(pendingKosts as any)?.pagination?.total ?? "-"}</p>
            <p className="text-xs text-zinc-500">Kost pending perlu review</p>
          </Card>
          <Card className="border-0 bg-white shadow-sm">
            <p className="text-xs font-medium tracking-widest text-zinc-500 uppercase">Aksi Cepat</p>
            <div className="mt-3 flex flex-col gap-2">
              <Link href="/dashboard/verification" className="text-sm font-medium text-[#8550e6] hover:underline">→ Buka antrian verifikasi</Link>
              <Link href="/dashboard/users" className="text-sm font-medium text-zinc-600 hover:underline">→ Kelola pengguna</Link>
            </div>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-zinc-900 to-zinc-800 text-white">
            <p className="text-xs tracking-widest text-zinc-400 uppercase">Sistem</p>
            <p className="mt-2 text-sm font-medium">Kost terverifikasi baru tampil di pencarian publik.</p>
            <p className="mt-1 text-xs text-zinc-400">Pastikan foto & alamat valid sebelum approve.</p>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-2 lg:p-6">
        <Skeleton className="h-36 rounded-[2rem]" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const s = stats as Record<string, number> | undefined;
  const total = Number(s?.total_rooms || 0);
  const occupied = Number(s?.occupied || 0);
  const available = Number(s?.available || 0);
  const reserved = Number(s?.reserved || 0);
  const pending = Number(s?.pending_bookings || 0);
  const active = Number(s?.active_contracts || 0);
  const occupancy = Number(s?.occupancy_rate || 0);

  const donut = [
    { name: "Terisi", value: occupied, color: VIOLET },
    { name: "Kosong", value: available, color: EMERALD },
    { name: "Reserved", value: reserved, color: AMBER },
  ].filter((d) => d.value > 0);

  const barData = [
    { name: "Pending", v: pending },
    { name: "Aktif", v: active },
    { name: "Kosong", v: available },
  ];

  return (
    <div className="space-y-6 p-2 lg:p-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#8550e6] via-[#7c3aed] to-[#4f46e5] p-8 text-white">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <p className="text-xs font-medium tracking-widest text-violet-100 uppercase">Kostify Owner</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Selamat datang, {user.name} 👋</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-violet-100">
            {total === 0 ? "Mulai dengan menambah kost pertama — verifikasi 1×24 jam." : `${total} kamar • ${occupancy.toFixed(0)}% okupansi • ${pending} booking menunggu`}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/dashboard/kosts/new"><Button className="bg-white text-zinc-900 hover:bg-zinc-100">Tambah Kost</Button></Link>
            <Link href="/dashboard/bookings"><Button variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20">Inbox Booking {pending > 0 && `(${pending})`}</Button></Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium tracking-widest text-zinc-500 uppercase">Total Kamar</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f5f0ff] text-[#8550e6]">🏠</span>
          </div>
          <p className="mt-3 text-3xl font-bold">{total}</p>
          <p className="text-xs text-zinc-500">{occupied} terisi • {available} kosong</p>
        </Card>
        <Card className="border-0 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium tracking-widest text-zinc-500 uppercase">Okupansi</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">📈</span>
          </div>
          <p className="mt-3 text-3xl font-bold">{occupancy.toFixed(1)}%</p>
          <Badge tone={occupancy > 70 ? "green" : occupancy > 40 ? "amber" : "zinc"} className="mt-1">{occupancy > 70 ? "Tinggi" : occupancy > 40 ? "Stabil" : "Perlu promo"}</Badge>
        </Card>
        <Card className="border-0 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium tracking-widest text-zinc-500 uppercase">Pending</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">⏳</span>
          </div>
          <p className="mt-3 text-3xl font-bold">{pending}</p>
          <Link href="/dashboard/bookings" className="text-xs font-medium text-[#8550e6] hover:underline">Lihat inbox →</Link>
        </Card>
        <Card className="border-0 bg-zinc-900 text-white">
          <p className="text-xs font-medium tracking-widest text-zinc-400 uppercase">Kontrak Aktif</p>
          <p className="mt-3 text-3xl font-bold">{active}</p>
          <p className="text-xs text-zinc-400">Sewa berjalan</p>
        </Card>
      </div>

      {/* Charts + Recent */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <h3 className="font-semibold">Sebaran Kamar</h3>
          <p className="text-xs text-zinc-500">Status kamar saat ini</p>
          <div className="mt-4 h-48">
            {donut.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donut} dataKey="value" nameKey="name" innerRadius={55} outerRadius={75} paddingAngle={4}>
                    {donut.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-zinc-500">Belum ada kamar</div>
            )}
          </div>
          <div className="mt-2 flex justify-center gap-4 text-xs">
            {donut.map((d) => (
              <span key={d.name} className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: d.color }} />{d.name} {d.value}</span>
            ))}
          </div>
        </Card>

        <Card className="border-0 shadow-sm">
          <h3 className="font-semibold">Ringkasan</h3>
          <p className="text-xs text-zinc-500">Booking vs kontrak vs ketersediaan</p>
          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: "#f5f0ff" }} />
                <Bar dataKey="v" radius={[8, 8, 0, 0]} fill={VIOLET} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent */}
      <Card className="border-0 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Booking Terbaru</h3>
          <Link href="/dashboard/bookings" className="text-xs font-medium text-[#8550e6] hover:underline">Lihat semua</Link>
        </div>
        {!recentBookings?.items?.length ? (
          <p className="mt-4 text-sm text-zinc-500">Belum ada booking</p>
        ) : (
          <div className="mt-4 divide-y">
            {(recentBookings.items as any[]).slice(0, 5).map((b: any) => (
              <div key={b.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">Kamar {b.room?.room_number} • {b.tenant?.name || b.tenant_id.slice(0, 8)}</p>
                  <p className="text-xs text-zinc-500">{new Date(b.created_at).toLocaleDateString("id-ID")} • exp {new Date(b.expires_at).toLocaleDateString("id-ID")}</p>
                </div>
                <Badge tone={b.status === "pending" ? "amber" : b.status === "approved" ? "green" : "zinc"}>{b.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
