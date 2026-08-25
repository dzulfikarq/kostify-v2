"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingsApi } from "@/services/api/bookings";
import { useMe } from "@/hooks/useAuth";
import { Card, Skeleton } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
import Link from "next/link";
import { toast } from "sonner";

export default function MyBookingsPage() {
  const { data: user, isLoading: meLoading } = useMe();
  const [status, setStatus] = useState("");
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

  if (meLoading) return <div className="p-8 text-center text-sm text-zinc-500">Memuat...</div>;
  if (!user) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <p className="text-sm text-zinc-600">Silakan login untuk melihat booking</p>
        <Link href="/login" className="mt-2 inline-block text-sm underline">Masuk</Link>
      </div>
    );
  }
  if (user.role !== "tenant") {
    return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-sm">Halaman ini hanya untuk pencari kost</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold">Booking Saya</h1>

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
          <Card className="text-center text-sm text-red-600">Gagal memuat</Card>
        ) : !data?.items.length ? (
          <EmptyState title="Belum ada booking" description="Mulai cari kost dan booking kamar." action={<Link href="/kosts"><Button> Cari Kost</Button></Link>} />
        ) : (
          <div className="space-y-3">
            {data.items.map((b) => (
              <Card key={b.id} className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-mono text-sm font-semibold">Kamar {b.room?.room_number || b.room_id.slice(0, 8)}</p>
                  <p className="text-sm text-zinc-600">Rp {Number(b.room?.price_monthly || 0).toLocaleString("id-ID")} • Expires {new Date(b.expires_at).toLocaleString("id-ID")}</p>
                  <p className="text-xs text-zinc-500">{new Date(b.created_at).toLocaleString("id-ID")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={b.status === "pending" ? "amber" : b.status === "approved" ? "green" : b.status === "rejected" ? "red" : "zinc"}>{b.status}</Badge>
                  {b.status === "pending" && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={cancelMut.isPending}
                      onClick={() => {
                        if (!confirm("Batalkan booking ini?")) return;
                        cancelMut.mutate(b.id);
                      }}
                    >
                      Batal
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
