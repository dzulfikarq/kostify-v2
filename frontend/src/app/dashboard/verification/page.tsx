"use client";

import { redirect } from "next/navigation";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardApi } from "@/services/api/dashboard";
import { surveyApi, chatApi } from "@/services/api/extras";
import { useMe } from "@/hooks/useAuth";
import { Card, Skeleton } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty";
import { TableRoot, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/tailgrids/core/table";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/utils/date";
import { useLang } from '@/i18n';
import { toast } from 'sonner';

export default function VerificationPage() {
  const { t } = useLang();
  const { data: user } = useMe();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-kosts", "pending"],
    queryFn: () => dashboardApi.listAdminKosts({ status: "pending", limit: 50 }),
    enabled: user?.role === "super_admin",
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-kosts"] });
    qc.invalidateQueries({ queryKey: ["master-kosts"] });
  };

  const teknisiQ = useQuery({
    queryKey: ["teknisi-list"],
    queryFn: () => surveyApi.listTeknisi(),
    enabled: user?.role === "super_admin",
  });

  const assignmentsQ = useQuery({
    queryKey: ["admin-assignments"],
    queryFn: () => surveyApi.listAssignmentsAdmin(),
    enabled: user?.role === "super_admin",
  });
  const assignedKostIds = new Set((assignmentsQ.data || []).filter((a) => !a.decided_at).map((a) => a.kost_id));

  const [assignTarget, setAssignTarget] = useState<null | { id: string; name: string }>(null);
  const [assignTeknisi, setAssignTeknisi] = useState("");
  const [assignDate, setAssignDate] = useState("");
  const assignMut = useMutation({
    mutationFn: () => surveyApi.assign(assignTarget!.id, assignTeknisi, assignDate ? new Date(assignDate).toISOString() : undefined),
    onSuccess: () => { toast.success("Teknisi ditugaskan untuk survey"); setAssignTarget(null); invalidate(); qc.invalidateQueries({ queryKey: ["admin-assignments"] }); },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || "Gagal assign teknisi"),
  });

  if (user && user.role !== "super_admin") redirect("/403");

  return (
    <div className="space-y-5 p-2 lg:p-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">{t("vf.judul")}</h1>
        <p className="text-sm text-zinc-500">{t("vf.sub")}</p>
      </div>

      {isLoading ? (
        <Card className="p-0 overflow-hidden"><Skeleton className="h-64" /></Card>
      ) : !data?.items.length ? (
        <EmptyState title={t('vf.kosong')} description={t('vf.kosong_sub')} action={<Link href="/dashboard/master-kost"><Button>{t("vf.lihat_master")}</Button></Link>} />
      ) : (
        <Card className="p-0 overflow-hidden border-0 shadow-sm">
          <TableRoot>
            <TableHeader>
              <TableRow className="bg-zinc-50/50">
                <TableHead>{t("kost.kolom.kost")}</TableHead>
                <TableHead>{t("mk.owner")}</TableHead>
                <TableHead>{t("vf.kolom.diajukan")}</TableHead>
                <TableHead className="text-right">{t("kost.kolom.aksi")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((k: any) => (
                <TableRow key={k.id} className="hover:bg-[#f5f0ff]/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f5f0ff] text-[#8550e6] text-sm font-bold">{k.name.charAt(0).toUpperCase()}</div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{k.name}</p>
                        <p className="truncate text-xs text-zinc-500">{[k.village, k.district, k.regency].filter(Boolean).join(", ") || k.city} • {k.gender}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><p className="text-xs text-zinc-500">{k.owner?.email || "-"}</p></TableCell>
                  <TableCell><p className="text-xs text-zinc-500">{formatDateTime(k.created_at)}</p></TableCell>
                  <TableCell>
                    <div className="flex flex-wrap justify-end items-center gap-1">
                      <Link href={`/kosts/${k.id}`} target="_blank"><Button variant="outline" size="sm">{t("c.detail")}</Button></Link>
                      <button
                        className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-[#8550e6] hover:bg-[#f5f0ff]"
                        onClick={async () => {
                          try {
                            const conv = await chatApi.start(k.owner_id);
                            window.open(`/chat?c=${conv.id}`, "_blank");
                          } catch {
                            toast.error("Gagal memulai chat");
                          }
                        }}
                      >
                        Chat Pemilik
                      </button>
                      <Button size="sm" className="bg-zinc-900 hover:bg-black" onClick={() => { setAssignTarget({ id: k.id, name: k.name }); setAssignTeknisi(""); setAssignDate(""); }}>
                        Survey Teknisi
                      </Button>
                      {assignedKostIds.has(k.id) && <Badge tone="green">Sudah diassign</Badge>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </TableRoot>
        </Card>
      )}

      {/* Dialog assign teknisi */}
      {assignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-sm space-y-3 border-0 shadow-xl">
            <h3 className="font-semibold">Assign Teknisi — {assignTarget.name}</h3>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-zinc-700">Teknisi *</span>
              <select value={assignTeknisi} onChange={(e) => setAssignTeknisi(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm">
                <option value="">Pilih teknisi</option>
                {(teknisiQ.data || []).map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-zinc-700">Jadwal Survey (opsional)</span>
              <input
                type="datetime-local"
                value={assignDate}
                onChange={(e) => setAssignDate(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm"
              />
            </label>
            {!(teknisiQ.data || []).length && (
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
                Belum ada teknisi. Buat dulu di halaman Pengguna dengan role teknisi.
              </p>
            )}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setAssignTarget(null)}>Batal</Button>
              <Button
                className="flex-1 shadow-sm"
                disabled={!assignTeknisi || assignMut.isPending}
                onClick={() => assignMut.mutate()}
              >
                {assignMut.isPending ? "Menugaskan..." : "Assign"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
