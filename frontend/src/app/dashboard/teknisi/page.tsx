"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { surveyApi } from "@/services/api/extras";
import { useMe } from "@/hooks/useAuth";
import { Card, Skeleton } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { Buildings11 } from "@tailgrids/icons";

export default function TeknisiDashboardPage() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [decideTarget, setDecideTarget] = useState<null | { id: string; name: string; decision: "approved" | "rejected" }>(null);
  const [note, setNote] = useState("");

  const { data: assignments, isLoading } = useQuery({
    queryKey: ["teknisi-assignments"],
    queryFn: () => surveyApi.listAssignments(),
    enabled: me?.role === "teknisi",
  });

  const decideMut = useMutation({
    mutationFn: () => surveyApi.decide(decideTarget!.id, decideTarget!.decision, note.trim()),
    onSuccess: () => {
      toast.success("Keputusan survey tersimpan");
      setDecideTarget(null);
      setNote("");
      qc.invalidateQueries({ queryKey: ["teknisi-assignments"] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || "Gagal menyimpan keputusan"),
  });

  if (me && me.role !== "teknisi") return <div className="p-6 text-sm">Hanya teknisi</div>;

  const pending = (assignments || []).filter((a) => !a.decided_at);
  const done = (assignments || []).filter((a) => a.decided_at);

  return (
    <div className="space-y-5 p-2 lg:p-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Tugas Survey</h1>
        <p className="text-sm text-zinc-500">Kost yang ditugaskan untuk Anda survey. Buat keputusan setelah survey selesai.</p>
      </div>

      {isLoading ? (
        <Card className="p-0 overflow-hidden"><Skeleton className="h-48" /></Card>
      ) : !assignments?.length ? (
        <EmptyState title="Belum ada tugas" description="Anda akan menerima notifikasi saat admin menugaskan survey kost." />
      ) : (
        <>
          {/* Perlu survey */}
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">Perlu Survey ({pending.length})</h2>
            <div className="grid gap-3">
              {pending.map((a) => (
                <Card key={a.id} className="flex flex-wrap items-center gap-4 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f0ff] text-[#8550e6]">
                    <Buildings11 size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{a.kost?.name || "Kost"}</p>
                    <p className="truncate text-xs text-zinc-500">
                      {[a.kost?.village, a.kost?.district, a.kost?.regency].filter(Boolean).join(", ") || a.kost?.city} • {a.kost?.gender}
                    </p>
                  </div>
                  <Badge tone="amber">{a.status}</Badge>
                  <div className="flex gap-1.5">
                    <Link href={`/kosts/${a.kost_id}`} target="_blank"><Button variant="outline" size="sm">Lihat</Button></Link>
                    <Button size="sm" onClick={() => setDecideTarget({ id: a.id, name: a.kost?.name || "Kost", decision: "approved" })} className="shadow-sm">Setujui</Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => setDecideTarget({ id: a.id, name: a.kost?.name || "Kost", decision: "rejected" })}>Tolak</Button>
                  </div>
                </Card>
              ))}
              {!pending.length && <p className="text-sm text-zinc-500">Semua tugas sudah diproses. 👍</p>}
            </div>
          </div>

          {/* Riwayat */}
          {done.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">Riwayat ({done.length})</h2>
              <div className="grid gap-3">
                {done.map((a) => (
                  <Card key={a.id} className="flex flex-wrap items-center gap-4 p-4 opacity-80">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{a.kost?.name || "Kost"}</p>
                      {a.note && <p className="truncate text-xs text-zinc-500">Catatan: {a.note}</p>}
                    </div>
                    <Badge tone={a.decision === "approved" ? "green" : "red"}>{a.decision === "approved" ? "Disetujui" : "Ditolak"}</Badge>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Dialog keputusan */}
      {decideTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-sm space-y-3 border-0 shadow-xl">
            <h3 className="font-semibold">
              {decideTarget.decision === "approved" ? "Setujui" : "Tolak"} — {decideTarget.name}
            </h3>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-zinc-700">Catatan Hasil Survey * (min. 5 karakter)</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                autoFocus
                placeholder="Contoh: kondisi kamar sesuai foto, fasilitas lengkap..."
                className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#8550e6] focus:ring-2 focus:ring-[#ede5fe]"
              />
            </label>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setDecideTarget(null)}>Batal</Button>
              <Button
                className={`flex-1 shadow-sm ${decideTarget.decision === "rejected" ? "bg-red-600 hover:bg-red-700" : ""}`}
                disabled={note.trim().length < 5 || decideMut.isPending}
                onClick={() => decideMut.mutate()}
              >
                {decideMut.isPending ? "Menyimpan..." : decideTarget.decision === "approved" ? "Setujui Kost" : "Tolak Kost"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      <ConfirmDialog open={false} title="" onConfirm={() => {}} onCancel={() => {}} />
    </div>
  );
}
