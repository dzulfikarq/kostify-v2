"use client";

import { useQuery } from "@tanstack/react-query";
import { useMe } from "@/hooks/useAuth";
import { dashboardApi } from "@/services/api/dashboard";
import { Card, Skeleton } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function DashboardPage() {
  const { data: user } = useMe();
  const isOwner = user?.role === "owner";

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => dashboardApi.stats(),
    enabled: isOwner,
  });

  if (!user) return <div className="p-6 text-sm text-zinc-500">Memuat...</div>;

  if (!isOwner && user.role !== "super_admin") {
    return <div className="p-6 text-sm">Akses dashboard hanya untuk pemilik kost / admin</div>;
  }

  if (!isOwner) {
    return (
      <div className="space-y-6 p-2 lg:p-6">
        <h1 className="text-2xl font-bold">Admin Overview</h1>
        <Card>
          <p className="text-sm text-zinc-600">Selamat datang, Super Admin. Kelola verifikasi kost dan pengguna.</p>
          <div className="mt-4 flex gap-2">
            <Link href="/dashboard/verification" className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white">Verifikasi Kost</Link>
            <Link href="/dashboard/users" className="rounded-xl border px-4 py-2 text-sm">Kelola Users</Link>
          </div>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 p-6 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }

  const s = stats as Record<string, number> | undefined;
  return (
    <div className="space-y-6 p-2 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-zinc-500">Ringkasan properti milik Anda</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-xs text-zinc-500">Total Kamar</p>
          <p className="mt-1 text-2xl font-bold">{s?.total_rooms ?? "-"}</p>
          <p className="text-xs text-zinc-500">{s?.occupied ?? 0} terisi • {s?.available ?? 0} kosong • {s?.reserved ?? 0} reserved</p>
        </Card>
        <Card>
          <p className="text-xs text-zinc-500">Okupansi</p>
          <p className="mt-1 text-2xl font-bold">{s?.occupancy_rate ? `${Number(s.occupancy_rate).toFixed(1)}%` : "0%"}</p>
          <Badge tone={Number(s?.occupancy_rate) > 70 ? "green" : "amber"}>{Number(s?.occupancy_rate) > 70 ? "Tinggi" : "Perlu promo"}</Badge>
        </Card>
        <Card>
          <p className="text-xs text-zinc-500">Pending Booking</p>
          <p className="mt-1 text-2xl font-bold">{s?.pending_bookings ?? 0}</p>
          <Link href="/dashboard/bookings" className="text-xs underline">Lihat inbox →</Link>
        </Card>
        <Card>
          <p className="text-xs text-zinc-500">Kontrak Aktif</p>
          <p className="mt-1 text-2xl font-bold">{s?.active_contracts ?? 0}</p>
        </Card>
      </div>
    </div>
  );
}
