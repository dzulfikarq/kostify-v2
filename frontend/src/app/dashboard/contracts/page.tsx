"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardApi } from "@/services/api/dashboard";
import { Card, Skeleton } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
import { TableRoot, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/tailgrids/core/table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { UserDetailModal } from "@/components/ui/user-detail-modal";
import { formatDate } from "@/utils/date";
import { useLang } from '@/i18n';
import { toast } from 'sonner';
import { useState } from "react";

export default function ContractsPage() {
  const { t } = useLang();
  const qc = useQueryClient();
  const [endId, setEndId] = useState<string | null>(null);
  const [detailUser, setDetailUser] = useState<null | { id: string; name: string; email: string; phone?: string; role: string; is_active: boolean; created_at: string }>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["owner-contracts"],
    queryFn: () => dashboardApi.listOwnerContracts({ limit: 20 }),
  });

  const endMut = useMutation({
    mutationFn: (id: string) => dashboardApi.endContract(id),
    onSuccess: () => {
      toast.success("Kontrak diakhiri, kamar tersedia kembali");
      qc.invalidateQueries({ queryKey: ["owner-contracts"] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || "Gagal mengakhiri"),
  });

  return (
    <div className="space-y-5 p-2 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("nav.kontrak")}</h1>
        <p className="text-sm text-zinc-500">Sewa aktif — akhiri lebih awal jika penyewa keluar</p>
      </div>

      {isLoading ? (
        <Card className="p-0 overflow-hidden"><Skeleton className="h-64" /></Card>
      ) : !data?.items.length ? (
        <EmptyState title={t('ct.kosong')} description={t('ct.kosong_sub')} />
      ) : (
        <Card className="p-0 overflow-hidden border-0 shadow-sm">
          <TableRoot>
            <TableHeader>
              <TableRow className="bg-zinc-50/50">
                <TableHead>{t("bk.kolom.kamar")}</TableHead>
                <TableHead>{t("bk.kolom.penyewa")}</TableHead>
                <TableHead>{t("bk.tgl_mulai")}</TableHead>
                <TableHead>{t("bk.kolom.status")}</TableHead>
                <TableHead className="text-right">{t("kost.kolom.aksi")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((c: any) => (
                <TableRow key={c.id} className="hover:bg-[#f5f0ff]/40">
                  <TableCell>
                    <span className="inline-flex h-8 w-10 items-center justify-center rounded-lg bg-zinc-900 text-xs font-mono font-bold text-white">{c.room?.room_number || "?"}</span>
                  </TableCell>
                  <TableCell>
                    <button className="text-left hover:opacity-80" onClick={() => c.tenant && setDetailUser(c.tenant)}>
                      <p className="text-sm font-medium underline-offset-2 hover:underline">{c.tenant?.name || c.tenant_id.slice(0, 8)}</p>
                      <p className="text-xs text-zinc-500">{c.tenant?.email || ""}</p>
                    </button>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{formatDate(c.start_date)} → {formatDate(c.end_date)}</p>
                    <p className="text-xs text-zinc-500">{c.status === "active" ? t("ct.berjalan") : t("ct.selesai")}</p>
                  </TableCell>
                  <TableCell><Badge tone={c.status === "active" ? "green" : "zinc"}>{c.status}</Badge></TableCell>
                  <TableCell>
                    {c.status === "active" ? (
                      <div className="flex justify-end">
                        <Button variant="outline" size="sm" onClick={() => setEndId(c.id)} disabled={endMut.isPending}>{t("ct.akhiri")}</Button>
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

      {endId && (
        <ConfirmDialog open title={t("ct.cd_akhiri")} description={t("ct.cd_akhiri_desc")} tone="red" confirmText={t("ct.akhiri")} onConfirm={() => { endMut.mutate(endId); setEndId(null); }} onCancel={() => setEndId(null)} />
      )}

      <UserDetailModal user={detailUser} onClose={() => setDetailUser(null)} />
    </div>
  );
}
