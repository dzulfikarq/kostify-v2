"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardApi } from "@/services/api/dashboard";
import { Card, Skeleton } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { TableRoot, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/tailgrids/core/table";
import { toast } from "sonner";

export default function BookingsPage() {
  const [status, setStatus] = useState("pending");
  const [approveId, setApproveId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [duration, setDuration] = useState(3);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["owner-bookings", status],
    queryFn: () => dashboardApi.listOwnerBookings({ status: status || undefined, limit: 20 }),
  });

  const approveMut = useMutation({
    mutationFn: () => dashboardApi.approveBooking(approveId!, { start_date: startDate, duration_months: duration }),
    onSuccess: () => {
      toast.success("Booking disetujui, kontrak dibuat");
      setApproveId(null);
      qc.invalidateQueries({ queryKey: ["owner-bookings"] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || "Gagal menyetujui"),
  });

  const rejectMut = useMutation({
    mutationFn: (id: string) => dashboardApi.rejectBooking(id, { reason: "Tidak cocok setelah survey" }),
    onSuccess: () => {
      toast.success("Booking ditolak");
      qc.invalidateQueries({ queryKey: ["owner-bookings"] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || "Gagal menolak"),
  });

  return (
    <div className="space-y-5 p-2 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inbox Booking</h1>
        <p className="text-sm text-zinc-500">Kelola permintaan booking — setujui setelah survey, tolak jika tidak cocok</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {[
          { label: "Pending", value: "pending" },
          { label: "Approved", value: "approved" },
          { label: "Rejected", value: "rejected" },
          { label: "Expired", value: "expired" },
          { label: "Cancelled", value: "cancelled" },
          { label: "Semua", value: "" },
        ].map((s) => (
          <button
            key={s.value}
            onClick={() => setStatus(s.value)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${status === s.value ? "bg-[#8550e6] text-white shadow-sm" : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Card className="p-0 overflow-hidden"><Skeleton className="h-64" /></Card>
      ) : !data?.items.length ? (
        <EmptyState title={status === "pending" ? "Tidak ada booking pending" : "Tidak ada booking"} description={status === "pending" ? "Booking baru akan muncul di sini. Pastikan kamar tersedia." : "Coba ganti filter status."} />
      ) : (
        <Card className="p-0 overflow-hidden border-0 shadow-sm">
          <TableRoot>
            <TableHeader>
              <TableRow className="bg-zinc-50/50">
                <TableHead>Kamar</TableHead>
                <TableHead>Penyewa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((b: any) => (
                <TableRow key={b.id} className="hover:bg-[#f5f0ff]/40">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-xs font-mono font-bold text-white">{b.room?.room_number || "?"}</span>
                      <div>
                        <p className="text-sm font-medium">Rp {Number(b.room?.price_monthly || 0).toLocaleString("id-ID")}</p>
                        <p className="text-xs text-zinc-500">{b.room?.kost_id?.slice(0, 8) || ""}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{b.tenant?.name || b.tenant_id.slice(0, 8)}</p>
                    <p className="text-xs text-zinc-500">{b.tenant?.email || ""}</p>
                  </TableCell>
                  <TableCell><Badge tone={b.status === "pending" ? "amber" : b.status === "approved" ? "green" : b.status === "rejected" ? "red" : "zinc"}>{b.status}</Badge></TableCell>
                  <TableCell>
                    <p className="text-xs">{new Date(b.expires_at).toLocaleDateString("id-ID")}</p>
                    <p className="text-xs text-zinc-500">{new Date(b.created_at).toLocaleDateString("id-ID")}</p>
                  </TableCell>
                  <TableCell>
                    {b.status === "pending" ? (
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" onClick={() => setApproveId(b.id)} className="shadow-sm">Setujui</Button>
                        <Button variant="outline" size="sm" onClick={() => { if (confirm("Tolak booking ini?")) rejectMut.mutate(b.id); }}>Tolak</Button>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </TableRoot>
        </Card>
      )}

      {approveId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md space-y-4 border-0 shadow-xl">
            <div>
              <h3 className="text-lg font-bold">Setujui Booking</h3>
              <p className="text-sm text-zinc-500">Buat kontrak sewa 1–12 bulan. Kamar akan menjadi occupied.</p>
            </div>
            <Input label="Tanggal Mulai" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-zinc-700">Durasi</span>
              <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#8550e6] focus:ring-2 focus:ring-[#ede5fe] outline-none">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n} bulan</option>
                ))}
              </select>
            </label>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setApproveId(null)}>Batal</Button>
              <Button className="flex-1 shadow-sm" disabled={approveMut.isPending} onClick={() => approveMut.mutate()}>{approveMut.isPending ? "Memproses..." : "Konfirmasi"}</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
