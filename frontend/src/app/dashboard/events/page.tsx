"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eventsApi, surveyApi } from "@/services/api/extras";
import { dashboardApi } from "@/services/api/dashboard";
import { useMe } from "@/hooks/useAuth";
import { Card, Skeleton } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatDateTime } from "@/utils/date";
import { toast } from "sonner";

export default function EventsPage() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const isAdmin = me?.role === "super_admin";
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", kost_id: "", teknisi_id: "", scheduled_at: "", notes: "" });
  const [confirm, setConfirm] = useState<null | { id: string; title: string }>(null);

  const eventsQ = useQuery({
    queryKey: ["events"],
    queryFn: () => eventsApi.list(),
    enabled: !!me,
    refetchInterval: 30000,
  });

  const kostsQ = useQuery({
    queryKey: ["master-kosts-events"],
    queryFn: () => dashboardApi.listAdminKosts({ limit: 100 }),
    enabled: isAdmin,
  });
  const teknisiQ = useQuery({
    queryKey: ["teknisi-list"],
    queryFn: () => surveyApi.listTeknisi(),
    enabled: isAdmin,
  });

  const createMut = useMutation({
    mutationFn: () =>
      eventsApi.create({
        title: form.title.trim(),
        kost_id: form.kost_id || undefined,
        teknisi_id: form.teknisi_id || undefined,
        scheduled_at: new Date(form.scheduled_at).toISOString(),
        notes: form.notes.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Jadwal survey dibuat");
      setShowCreate(false);
      setForm({ title: "", kost_id: "", teknisi_id: "", scheduled_at: "", notes: "" });
      qc.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || "Gagal membuat jadwal"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => eventsApi.remove(id),
    onSuccess: () => {
      toast.success("Jadwal dihapus");
      setConfirm(null);
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });

  if (!me) return <div className="p-6 text-sm">Login dulu</div>;

  const events = eventsQ.data || [];

  return (
    <div className="space-y-5 p-2 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Jadwal Survey</h1>
          <p className="text-sm text-zinc-500">
            {isAdmin
              ? "Buat & kelola jadwal survey kost, assign teknisi."
              : me.role === "teknisi"
                ? "Jadwal survey yang ditugaskan kepada Anda (readonly)."
                : "Jadwal survey untuk kost Anda (readonly)."}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowCreate(true)} className="shadow-sm">+ Buat Jadwal</Button>
        )}
      </div>

      {eventsQ.isLoading ? (
        <Card className="p-0 overflow-hidden"><Skeleton className="h-48" /></Card>
      ) : !events.length ? (
        <EmptyState title="Belum ada jadwal" description={isAdmin ? "Buat jadwal survey untuk kost yang perlu direview." : "Belum ada jadwal survey untuk Anda."} />
      ) : (
        <div className="grid gap-3">
          {events.map((e) => {
            const d = new Date(e.scheduled_at);
            const past = d < new Date();
            return (
              <Card key={e.id} className={`flex flex-wrap items-center gap-4 p-4 ${past ? "opacity-60" : ""}`}>
                <div className="flex h-12 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-[#f5f0ff] text-[#8550e6]">
                  <span className="text-lg font-bold leading-none">{d.getDate()}</span>
                  <span className="text-[10px] uppercase">{d.toLocaleDateString("id-ID", { month: "short" })}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{e.title}</p>
                  <p className="truncate text-xs text-zinc-500">
                    {e.kost?.name || "-"} • {d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    {e.teknisi ? ` • Teknisi: ${e.teknisi.name}` : ""}
                  </p>
                  {e.notes && <p className="truncate text-xs text-zinc-400">{e.notes}</p>}
                </div>
                <Badge tone={past ? "zinc" : "green"}>{past ? "Selesai" : "Terjadwal"}</Badge>
                {isAdmin && (
                  <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => setConfirm({ id: e.id, title: e.title })}>
                    Hapus
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal create (admin) */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm overflow-y-auto">
          <Card className="my-8 w-full max-w-md space-y-3 border-0 shadow-xl">
            <h3 className="font-semibold">Buat Jadwal Survey</h3>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-zinc-700">Judul *</span>
              <input value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} placeholder="Survey Kost X" className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#8550e6]" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-zinc-700">Kost</span>
              <select value={form.kost_id} onChange={(e) => setForm((s) => ({ ...s, kost_id: e.target.value }))} className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm">
                <option value="">Pilih kost (opsional)</option>
                {(kostsQ.data?.items || []).map((k: any) => (
                  <option key={k.id} value={k.id}>{k.name}</option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-zinc-700">Teknisi</span>
              <select value={form.teknisi_id} onChange={(e) => setForm((s) => ({ ...s, teknisi_id: e.target.value }))} className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm">
                <option value="">Pilih teknisi (opsional)</option>
                {(teknisiQ.data || []).map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-zinc-700">Tanggal & Jam *</span>
              <input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm((s) => ({ ...s, scheduled_at: e.target.value }))} className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-zinc-700">Catatan</span>
              <textarea value={form.notes} onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))} rows={2} className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#8550e6]" />
            </label>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>Batal</Button>
              <Button className="flex-1 shadow-sm" disabled={!form.title || !form.scheduled_at || createMut.isPending} onClick={() => createMut.mutate()}>
                {createMut.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        title={`Hapus jadwal "${confirm?.title}"?`}
        tone="red"
        onConfirm={() => confirm && deleteMut.mutate(confirm.id)}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
