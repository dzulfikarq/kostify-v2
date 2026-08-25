"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingsApi } from "@/services/api/bookings";
import { useMe } from "@/hooks/useAuth";
import { Card, Skeleton } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatDateTime } from "@/utils/date";
import Link from "next/link";
import { useLang } from '@/i18n';
import { toast } from 'sonner';

export default function MyBookingsPage() {
  const { t } = useLang();
  const { data: user, isLoading: meLoading } = useMe();
  const [status, setStatus] = useState("");
  const [cancelId, setCancelId] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["bookings", "me", status],
    queryFn: () => bookingsApi.listMe({ status: status || undefined }),
    enabled: !!user,
  });

  const cancelMut = useMutation({
    mutationFn: (id: string) => bookingsApi.cancel(id),
    onSuccess: () => {
      toast.success("Booking dibatalkan");
      qc.invalidateQueries({ queryKey: ["bookings", "me"] });
    },
  });

  if (meLoading) return <div className="p-8 text-center text-sm text-zinc-500">{t("c.muat")}</div>;
  if (!user) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <p className="text-sm text-zinc-600">{t("mb.login_first")}</p>
        <Link href="/login" className="mt-2 inline-block text-sm underline">{t("ph.masuk")}</Link>
      </div>
    );
  }
  if (user.role !== "tenant") {
    return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-sm">{t("mb.hanya_tenant")}</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold">{t("mb.judul")}</h1>

      <div className="mt-4 flex gap-2">
        {["", "pending", "approved", "rejected", "expired", "cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-full border px-3 py-1.5 text-sm ${status === s ? "bg-zinc-900 text-white border-zinc-900" : "bg-white hover:bg-zinc-50"}`}
          >
            {s || "Semua"}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : isError ? (
          <Card className="text-center text-sm text-red-600">{t("c.gagal")}</Card>
        ) : !data?.items.length ? (
          <EmptyState title={t('mb.belum')} description={t('mb.belum_sub')} action={<Link href="/kosts"><Button>{t("mb.cari_kost")}</Button></Link>} />
        ) : (
          <div className="space-y-3">
            {data.items.map((b) => (
              <Card key={b.id} className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-mono text-sm font-semibold">Kamar {b.room?.room_number || b.room_id.slice(0, 8)}</p>
                  <p className="text-sm text-zinc-600">Rp {Number(b.room?.price_monthly || 0).toLocaleString("id-ID")} • {t("mb.expires")} {formatDateTime(b.expires_at)}</p>
                  <p className="text-xs text-zinc-500">{formatDateTime(b.created_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={b.status === "pending" ? "amber" : b.status === "approved" ? "green" : b.status === "rejected" ? "red" : "zinc"}>{b.status}</Badge>
                  {b.status === "pending" && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={cancelMut.isPending}
                      onClick={() => setCancelId(b.id)}
                    >{t("mb.batal")}</Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {cancelId && (
        <ConfirmDialog open title={t('mb.cd_batal')} description={t('mb.cd_batal_desc')} tone='red' confirmText={t('mb.batal')} onConfirm={() => { cancelMut.mutate(cancelId); setCancelId(null); }} onCancel={() => setCancelId(null)} />
      )}
    </div>
  );
}
