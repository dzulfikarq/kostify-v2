"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { kostsApi } from "@/services/api/kosts";
import { bookingsApi } from "@/services/api/bookings";
import { useMe } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, Skeleton } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";

export default function KostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { data: user } = useMe();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["kost", id],
    queryFn: () => kostsApi.getPublic(id),
    enabled: !!id,
  });

  const bookMut = useMutation({
    mutationFn: (room_id: string) => bookingsApi.create(room_id),
    onSuccess: () => {
      toast.success("Booking berhasil — ter-reserve 3 hari, menunggu konfirmasi pemilik");
      qc.invalidateQueries({ queryKey: ["kost", id] });
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Skeleton className="h-64" />
        <Skeleton className="mt-4 h-32" />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <p className="text-sm text-red-600">Kost tidak ditemukan atau belum terverifikasi</p>
        <Link href="/kosts" className="mt-2 inline-block text-sm underline">
          Kembali ke daftar
        </Link>
      </div>
    );
  }

  const kost = data.kost;
  const rooms: NonNullable<typeof data.rooms> = data.rooms || [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/kosts" className="text-sm text-zinc-500 hover:text-zinc-900">← Kembali</Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        {/* Galeri */}
        <div>
          <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-zinc-100">
            {kost.photos?.[0] ? (
              <img src={kost.photos[0]} alt={kost.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-5xl">🏠</div>
            )}
          </div>
          {kost.photos?.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {kost.photos.slice(1, 5).map((p, i) => (
                <img key={i} src={p} alt="" className="aspect-square rounded-xl object-cover" />
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{kost.name}</h1>
              <Badge tone={kost.gender === "putra" ? "blue" : kost.gender === "putri" ? "amber" : "zinc"}>{kost.gender}</Badge>
            </div>
            <p className="mt-1 text-sm text-zinc-600">
              {kost.city} • {kost.address}
            </p>
            <p className="mt-3 text-sm leading-6 text-zinc-700">{kost.description || "Tidak ada deskripsi"}</p>
          </div>

          {kost.facilities?.length ? (
            <Card>
              <h3 className="text-sm font-semibold">Fasilitas</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {kost.facilities.map((f) => (
                  <Badge key={f} tone="zinc">{f}</Badge>
                ))}
              </div>
            </Card>
          ) : null}

          <Card>
            <h3 className="text-sm font-semibold">Kontak Pemilik</h3>
            <p className="mt-1 text-sm text-zinc-600">{kost.owner?.name || "Pemilik"} • {kost.owner?.email || ""}</p>
          </Card>
        </div>
      </div>

      {/* Rooms */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold">Daftar Kamar ({rooms.length})</h2>
        {!rooms.length ? (
          <Card className="mt-3 text-center text-sm text-zinc-500">Belum ada kamar</Card>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((rm) => {
              const canBook = rm.status === "available";
              return (
                <Card key={rm.id} className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold">{rm.room_number}</span>
                    <Badge tone={rm.status === "available" ? "green" : rm.status === "reserved" ? "amber" : rm.status === "occupied" ? "red" : "zinc"}>
                      {rm.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-zinc-600">Rp {Number(rm.price_monthly).toLocaleString("id-ID")} / bulan</p>
                  {rm.facilities?.length ? (
                    <p className="mt-2 text-xs text-zinc-500">{rm.facilities.join(" • ")}</p>
                  ) : null}
                  <div className="mt-4 flex-1" />
                  <Button
                    size="sm"
                    disabled={!canBook || bookMut.isPending}
                    onClick={() => {
                      if (!user) {
                        toast.error("Silakan login dulu sebagai pencari kost");
                        router.push(`/login?next=/kosts/${kost.id}`);
                        return;
                      }
                      if (user.role !== "tenant") {
                        toast.error("Hanya pencari kost (tenant) yang bisa booking");
                        return;
                      }
                      if (!confirm(`Booking kamar ${rm.room_number} seharga Rp ${Number(rm.price_monthly).toLocaleString("id-ID")}? Berlaku 3 hari.`)) return;
                      bookMut.mutate(rm.id);
                    }}
                  >
                    {canBook ? "Booking" : rm.status === "reserved" ? "Terpesan" : rm.status === "occupied" ? "Terisi" : "Maintenance"}
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
