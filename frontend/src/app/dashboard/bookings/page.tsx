"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardApi } from "@/services/api/dashboard";
import { Card, Skeleton } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
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
    onError: (e: any) => toast.error(e.response?.data?.error?.message || "Gagal"),
  });

  const rejectMut = useMutation({
    mutationFn: (id: string) => dashboardApi.rejectBooking(id, { reason: "Tidak cocok setelah survey" }),
    onSuccess: () => {
      toast.success("Booking ditolak");
      qc.invalidateQueries({ queryKey: ["owner-bookings"] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || "Gagal"),
  });

  return (
    <div className="space-y-4 p-2 lg:p-6">
      <h1 className="text-xl font-bold">Inbox Booking</h1>
      <div className="flex gap-2">
        {["pending", "approved", "rejected", "expired", "cancelled", ""].map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`rounded-full border px-3 py-1 text-sm ${status===s?"bg-zinc-900 text-white":"bg-white"}`}>{s||"Semua"}</button>
        ))}
      </div>

      {isLoading ? <Skeleton className="h-32" /> : !data?.items.length ? <EmptyState title="Tidak ada booking" /> : (
        <div className="space-y-3">
          {data.items.map((b: any) => (
            <Card key={b.id} className="flex flex-col gap-3">
              <div className="flex justify-between">
                <div>
                  <p className="font-mono text-sm">Kamar {b.room?.room_number} • {b.tenant?.name || b.tenant_id.slice(0,8)}</p>
                  <p className="text-xs text-zinc-500">Expires {new Date(b.expires_at).toLocaleString("id-ID")} • {new Date(b.created_at).toLocaleString("id-ID")}</p>
                </div>
                <Badge tone={b.status==="pending"?"amber":b.status==="approved"?"green":b.status==="rejected"?"red":"zinc"}>{b.status}</Badge>
              </div>
              {b.status==="pending" && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setApproveId(b.id)}>Setujui</Button>
                  <Button variant="outline" size="sm" onClick={() => { if(confirm("Tolak booking ini?")) rejectMut.mutate(b.id)}}>Tolak</Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {approveId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <Card className="w-full max-w-md space-y-3">
            <h3 className="font-semibold">Setujui Booking</h3>
            <Input label="Tanggal Mulai" type="date" value={startDate} onChange={(e)=>setStartDate(e.target.value)} />
            <label className="block space-y-1">
              <span className="text-sm font-medium">Durasi (bulan)</span>
              <select value={duration} onChange={(e)=>setDuration(Number(e.target.value))} className="w-full rounded-xl border px-3 py-2 text-sm">
                {Array.from({length:12},(_,i)=>i+1).map(n=><option key={n} value={n}>{n} bulan</option>)}
              </select>
            </label>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={()=>setApproveId(null)}>Batal</Button>
              <Button className="flex-1" disabled={approveMut.isPending} onClick={()=>approveMut.mutate()}>Konfirmasi</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
