"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { dashboardApi } from "@/services/api/dashboard";
import { Card, Skeleton } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function KostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { data: kost, isLoading } = useQuery({
    queryKey: ["owner-kost", id],
    queryFn: () => dashboardApi.getOwnerKost(id),
    enabled: !!id,
  });

  const { data: rooms, isLoading: roomsLoading } = useQuery({
    queryKey: ["rooms", id],
    queryFn: () => dashboardApi.listRooms(id),
    enabled: !!id,
  });

  const [form, setForm] = useState({ name: "", city: "", address: "", description: "", gender: "campur" });
  useEffect(() => {
    if (kost) setForm({ name: kost.name, city: kost.city, address: kost.address, description: kost.description, gender: kost.gender });
  }, [kost]);

  const updateMut = useMutation({
    mutationFn: () => dashboardApi.updateKost(id, form as never),
    onSuccess: () => {
      toast.success("Kost diperbarui");
      qc.invalidateQueries({ queryKey: ["owner-kost", id] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || "Gagal"),
  });

  const [newRoom, setNewRoom] = useState({ room_number: "", price_monthly: 1000000 as number | string, facilities: "" });
  const createRoomMut = useMutation({
    mutationFn: () =>
      dashboardApi.createRoom(id, {
        room_number: newRoom.room_number,
        price_monthly: Number(newRoom.price_monthly),
        facilities: newRoom.facilities.split(",").map((s) => s.trim()).filter(Boolean),
      } as never),
    onSuccess: () => {
      toast.success("Kamar ditambah");
      qc.invalidateQueries({ queryKey: ["rooms", id] });
      setNewRoom({ room_number: "", price_monthly: 1000000, facilities: "" });
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || "Gagal tambah kamar"),
  });

  const deleteRoomMut = useMutation({
    mutationFn: (roomId: string) => dashboardApi.deleteRoom(roomId),
    onSuccess: () => {
      toast.success("Kamar dihapus");
      qc.invalidateQueries({ queryKey: ["rooms", id] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || "Gagal hapus"),
  });

  if (isLoading) return <div className="p-6"><Skeleton className="h-40" /></div>;
  if (!kost) return <div className="p-6 text-sm">Kost tidak ditemukan</div>;

  return (
    <div className="space-y-6 p-2 lg:p-6">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold">{kost.name}</h1>
        <Badge tone={kost.status === "verified" ? "green" : kost.status === "pending" ? "amber" : "red"}>{kost.status}</Badge>
      </div>

      <Card className="space-y-3">
        <h2 className="font-semibold">Edit Kost</h2>
        <Input label="Nama" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
        <Input label="Kota" value={form.city} onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))} />
        <Input label="Alamat" value={form.address} onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))} />
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Deskripsi</span>
          <textarea value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} className="w-full rounded-xl border px-3 py-2 text-sm" rows={2} />
        </label>
        <select value={form.gender} onChange={(e) => setForm((s) => ({ ...s, gender: e.target.value }))} className="w-full rounded-xl border px-3 py-2 text-sm">
          <option value="campur">Campur</option>
          <option value="putra">Putra</option>
          <option value="putri">Putri</option>
        </select>
        <Button onClick={() => updateMut.mutate()} disabled={updateMut.isPending} className="w-full">{updateMut.isPending ? "Menyimpan..." : "Simpan"}</Button>
      </Card>

      <Card>
        <h2 className="font-semibold">Kamar</h2>
        {roomsLoading ? (
          <Skeleton className="mt-3 h-20" />
        ) : !rooms?.length ? (
          <p className="mt-2 text-sm text-zinc-500">Belum ada kamar</p>
        ) : (
          <div className="mt-3 space-y-2">
            {rooms.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border px-3 py-2">
                <div>
                  <p className="font-mono text-sm font-semibold">{r.room_number} <Badge tone={r.status==="available"?"green":r.status==="reserved"?"amber":r.status==="occupied"?"red":"zinc"}>{r.status}</Badge></p>
                  <p className="text-xs text-zinc-500">Rp {Number(r.price_monthly).toLocaleString("id-ID")}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={deleteRoomMut.isPending}
                  onClick={() => {
                    if (!confirm(`Hapus kamar ${r.room_number}?`)) return;
                    deleteRoomMut.mutate(r.id);
                  }}
                >
                  Hapus
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 grid gap-2 md:grid-cols-3">
          <Input placeholder="Nomor (A101)" value={newRoom.room_number} onChange={(e) => setNewRoom((s) => ({ ...s, room_number: e.target.value }))} />
          <Input type="number" placeholder="Harga" value={String(newRoom.price_monthly)} onChange={(e) => setNewRoom((s) => ({ ...s, price_monthly: e.target.value }))} />
          <Input placeholder="Fasilitas koma" value={newRoom.facilities} onChange={(e) => setNewRoom((s) => ({ ...s, facilities: e.target.value }))} />
        </div>
        <Button size="sm" className="mt-2 w-full" disabled={!newRoom.room_number || createRoomMut.isPending} onClick={() => createRoomMut.mutate()}>
          Tambah Kamar
        </Button>
      </Card>
    </div>
  );
}
