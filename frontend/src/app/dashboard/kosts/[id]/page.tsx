"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { dashboardApi } from "@/services/api/dashboard";
import { Card, Skeleton } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableRoot, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/tailgrids/core/table";
import { toast } from "sonner";
import Link from "next/link";

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
    onError: (e: any) => toast.error(e.response?.data?.error?.message || "Gagal memperbarui"),
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
    onError: (e: any) => toast.error(e.response?.data?.error?.message || e.response?.data?.error?.details?.[0]?.message || "Gagal tambah kamar"),
  });

  const deleteRoomMut = useMutation({
    mutationFn: (roomId: string) => dashboardApi.deleteRoom(roomId),
    onSuccess: () => {
      toast.success("Kamar dihapus");
      qc.invalidateQueries({ queryKey: ["rooms", id] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || e.response?.data?.error?.details?.[0]?.message || "Gagal hapus — hanya kamar available"),
  });

  if (isLoading) return <div className="p-6"><Skeleton className="h-64 rounded-2xl" /></div>;
  if (!kost) return <div className="p-6 text-sm">Kost tidak ditemukan</div>;

  return (
    <div className="space-y-6 p-2 lg:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/dashboard/kosts" className="rounded-xl border bg-white px-3 py-1.5 text-sm hover:bg-zinc-50">← Kembali</Link>
        <h1 className="text-xl font-bold tracking-tight">{kost.name}</h1>
        <Badge tone={kost.status === "verified" ? "green" : kost.status === "pending" ? "amber" : "red"}>{kost.status}</Badge>
        {kost.status === "pending" && <span className="text-xs text-zinc-500">Menunggu verifikasi admin</span>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-0 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f5f0ff] text-[#8550e6]">✎</span>
            <h2 className="font-semibold">Edit Kost</h2>
          </div>
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <Input label="Nama Kost *" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
              <Input label="Kota *" value={form.city} onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))} />
            </div>
            <Input label="Alamat" value={form.address} onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))} />
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-zinc-700">Deskripsi</span>
              <textarea value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} className="min-h-[80px] w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-[#8550e6] focus:ring-2 focus:ring-[#ede5fe]" rows={3} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-zinc-700">Peruntukan</span>
              <select value={form.gender} onChange={(e) => setForm((s) => ({ ...s, gender: e.target.value }))} className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#8550e6] focus:ring-2 focus:ring-[#ede5fe]">
                <option value="campur">Campur</option>
                <option value="putra">Putra</option>
                <option value="putri">Putri</option>
              </select>
            </label>
            <Button onClick={() => updateMut.mutate()} disabled={updateMut.isPending} className="w-full shadow-sm">{updateMut.isPending ? "Menyimpan..." : "Simpan Perubahan"}</Button>
          </div>
        </Card>

        <Card className="border-0 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">🛏</span>
            <h2 className="font-semibold">Kamar • {rooms?.length ?? 0}</h2>
          </div>

          {roomsLoading ? (
            <Skeleton className="h-32 rounded-xl" />
          ) : !rooms?.length ? (
            <p className="py-8 text-center text-sm text-zinc-500">Belum ada kamar — tambah di bawah</p>
          ) : (
            <div className="overflow-hidden rounded-xl border">
              <TableRoot className="border-0">
                <TableHeader>
                  <TableRow className="bg-zinc-50/50">
                    <TableHead>Kamar</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rooms.map((r: any) => (
                    <TableRow key={r.id} className="hover:bg-zinc-50">
                      <TableCell><span className="font-mono text-sm font-semibold">{r.room_number}</span></TableCell>
                      <TableCell><span className="text-sm">Rp {Number(r.price_monthly).toLocaleString("id-ID")}</span></TableCell>
                      <TableCell><Badge tone={r.status === "available" ? "green" : r.status === "reserved" ? "amber" : r.status === "occupied" ? "red" : "zinc"}>{r.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={deleteRoomMut.isPending}
                            onClick={() => {
                              if (!confirm(`Hapus kamar ${r.room_number}? Hanya kamar available yang bisa dihapus.`)) return;
                              deleteRoomMut.mutate(r.id);
                            }}
                          >
                            Hapus
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </TableRoot>
            </div>
          )}

          <div className="mt-4 rounded-xl border border-dashed bg-zinc-50 p-4">
            <p className="text-sm font-medium">Tambah Kamar</p>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              <Input placeholder="Nomor (A101)" value={newRoom.room_number} onChange={(e) => setNewRoom((s) => ({ ...s, room_number: e.target.value }))} />
              <Input type="number" placeholder="Harga /bulan" value={String(newRoom.price_monthly)} onChange={(e) => setNewRoom((s) => ({ ...s, price_monthly: e.target.value }))} />
              <Input placeholder="Fasilitas (ac, wifi)" value={newRoom.facilities} onChange={(e) => setNewRoom((s) => ({ ...s, facilities: e.target.value }))} />
            </div>
            <Button size="sm" className="mt-3 w-full shadow-sm" disabled={!newRoom.room_number || createRoomMut.isPending} onClick={() => createRoomMut.mutate()}>
              {createRoomMut.isPending ? "Menambah..." : "+ Tambah Kamar"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
