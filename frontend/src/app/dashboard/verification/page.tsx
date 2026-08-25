"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardApi } from "@/services/api/dashboard";
import { useMe } from "@/hooks/useAuth";
import { Card, Skeleton } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty";
import { TableRoot, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/tailgrids/core/table";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatDateTime } from "@/utils/date";
import { useLang } from '@/i18n';
import { toast } from 'sonner';

export default function VerificationPage() {
  const { t } = useLang();
  const { data: user } = useMe();
  const qc = useQueryClient();
  const [rejectTarget, setRejectTarget] = useState<null | { id: string; name: string }>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [confirm, setConfirm] = useState<null | { title: string; desc: string; action: () => void; tone?: "violet" | "red" }>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-kosts", "pending"],
    queryFn: () => dashboardApi.listAdminKosts({ status: "pending", limit: 50 }),
    enabled: user?.role === "super_admin",
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-kosts"] });
    qc.invalidateQueries({ queryKey: ["master-kosts"] });
  };

  const verifyMut = useMutation({
    mutationFn: (id: string) => dashboardApi.verifyKost(id),
    onSuccess: () => { toast.success("Kost diverifikasi — kini tayang di pencarian"); invalidate(); },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || "Gagal verifikasi"),
  });
  const rejectMut = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => dashboardApi.rejectKost(id, note),
    onSuccess: () => { toast.success("Kost ditolak"); setRejectTarget(null); setRejectNote(""); invalidate(); },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || "Gagal menolak"),
  });

  if (user && user.role !== "super_admin") return <div className="p-6 text-sm">Hanya super admin</div>;

  return (
    <div className="space-y-5 p-2 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("vf.judul")}</h1>
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
                      <Button size="sm" onClick={() => setConfirm({ title: t("vf.cd_setuju", { name: k.name }), desc: t("vf.cd_setuju_desc"), tone: "violet", action: () => { verifyMut.mutate(k.id); setConfirm(null); } })} className="shadow-sm">{t("vf.setujui")}</Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => { setRejectTarget({ id: k.id, name: k.name }); setRejectNote(""); }}>{t("vf.tolak")}</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </TableRoot>
        </Card>
      )}

      {/* Dialog alasan penolakan */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-sm space-y-3 border-0 shadow-xl">
            <h3 className="font-semibold">{t("vf.cd_tolak", { name: rejectTarget.name })}</h3>
            <Input
              label={t("vf.alasan_ph")}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder={t("vf.alasan_ph")}
              autoFocus
            />
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setRejectTarget(null)}>{t("c.batal")}</Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                disabled={!rejectNote.trim() || rejectMut.isPending}
                onClick={() => rejectMut.mutate({ id: rejectTarget.id, note: rejectNote.trim() })}
              >
                {t("vf.tolak")}
              </Button>
            </div>
          </Card>
        </div>
      )}

      <ConfirmDialog open={!!confirm} title={confirm?.title || ""} description={confirm?.desc} tone={confirm?.tone} confirmText={t("c.konfirmasi")} onConfirm={() => confirm?.action()} onCancel={() => setConfirm(null)} />
    </div>
  );
}
