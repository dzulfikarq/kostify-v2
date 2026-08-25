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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { UserDetailModal } from "@/components/ui/user-detail-modal";
import { formatDateTime } from "@/utils/date";
import { useLang } from '@/i18n';
import { toast } from 'sonner';

export default function BookingsPage() {
  const { t } = useLang();
  const [status, setStatus] = useState("pending");
  const [approveId, setApproveId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [duration, setDuration] = useState(3);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [detailUser, setDetailUser] = useState<null | { id: string; name: string; email: string; phone?: string; role: string; is_active: boolean; created_at: string }>(null);
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
  const rejectBooking = data?.items.find((b: any) => b.id === rejectId) as any | undefined;

  return (
    <div className="space-y-5 p-2 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("bk.judul")}</h1>
        <p className="text-sm text-zinc-500">Kelola permintaan booking — setujui setelah survey, tolak jika tidak cocok</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {[
          { label: t("status.pending"), value: "pending" },
          { label: t("status.verified"), value: "approved" },
          { label: t("status.rejected"), value: "rejected" },
          { label: "Expired", value: "expired" },
          { label: t("mb.batal"), value: "cancelled" },
          { label: t("c.semua"), value: "" },
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
        <EmptyState title={t("bk.kosong_pending")} description={t("bk.kosong_pending_sub")} />
      ) : (
        <Card className="p-0 overflow-hidden border-0 shadow-sm">
          <TableRoot>
            <TableHeader>
              <TableRow className="bg-zinc-50/50">
                <TableHead>{t("bk.kolom.kamar")}</TableHead>
                <TableHead>{t("bk.kolom.penyewa")}</TableHead>
                <TableHead>{t("bk.kolom.status")}</TableHead>
                <TableHead>{t("bk.kolom.expired")}</TableHead>
                <TableHead className="text-right">{t("kost.kolom.aksi")}</TableHead>
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
                    <button className="text-left hover:opacity-80" onClick={() => b.tenant && setDetailUser(b.tenant)}>
                      <p className="text-sm font-medium underline-offset-2 hover:underline">{b.tenant?.name || b.tenant_id.slice(0, 8)}</p>
                      <p className="text-xs text-zinc-500">{b.tenant?.email || ""}</p>
                    </button>
                  </TableCell>
                  <TableCell><Badge tone={b.status === "pending" ? "amber" : b.status === "approved" ? "green" : b.status === "rejected" ? "red" : "zinc"}>{b.status}</Badge></TableCell>
                  <TableCell>
                    <p className="text-xs">{formatDateTime(b.expires_at)}</p>
                    <p className="mt-1 text-xs text-zinc-500">Dibuat {formatDateTime(b.created_at)}</p>
                  </TableCell>
                  <TableCell>
                    {b.status === "pending" ? (
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" onClick={() => setApproveId(b.id)} className="shadow-sm">{t("bk.setujui")}</Button>
                        <Button variant="outline" size="sm" onClick={() => setRejectId(b.id)}>{t("bk.tolak")}</Button>
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

      {rejectId && (
        <ConfirmDialog open title={t("bk.cd_tolak")} description={t("bk.cd_tolak_desc")} tone="red" confirmText={t("bk.tolak")} onConfirm={() => { rejectMut.mutate(rejectId); setRejectId(null); }} onCancel={() => setRejectId(null)} />
      )}

      <UserDetailModal user={detailUser} onClose={() => setDetailUser(null)} />

      {approveId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md space-y-4 border-0 shadow-xl">
            <div>
              <h3 className="text-lg font-bold">{t("bk.penyeua_modal")}</h3>
              <p className="text-sm text-zinc-500">Buat kontrak sewa 1–12 bulan. Kamar akan menjadi occupied.</p>
            </div>
            <Input label={t("bk.tgl_mulai")} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-zinc-700">{t("bk.durasi")}</span>
              <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#8550e6] focus:ring-2 focus:ring-[#ede5fe] outline-none">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n} {t("bk.bulan")}</option>
                ))}
              </select>
            </label>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setApproveId(null)}>{t("c.batal")}</Button>
              <Button className="flex-1 shadow-sm" disabled={approveMut.isPending} onClick={() => approveMut.mutate()}>{approveMut.isPending ? "Memproses..." : "Konfirmasi"}</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
