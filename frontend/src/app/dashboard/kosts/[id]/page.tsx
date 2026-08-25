"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { dashboardApi } from "@/services/api/dashboard";
import { Card, Skeleton } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableRoot, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/tailgrids/core/table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { WilayahSelect } from "@/components/kost/WilayahSelect";
import { formatDateTime } from "@/utils/date";
import { toast } from "sonner";
import Link from "next/link";

const ROOMS_PER_PAGE = 5;

export default function KostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState<null | { title: string; desc: string; action: () => void; tone?: "violet" | "red" }>(null);
  const [roomPage, setRoomPage] = useState(1);

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

  // ---- Edit kost form (wilayah sama seperti tambah kost) ----
  const [form, setForm] = useState({ name: "", address: "", description: "", gender: "campur", province: "", regency: "", district: "", village: "", postal_code: "", provinceKode: "", regencyKode: "", districtKode: "", villageKode: "" });
  useEffect(() => {
    if (!kost) return;
    setForm({
      name: kost.name,
      address: kost.address || "",
      description: kost.description || "",
      gender: kost.gender,
      province: kost.province || "",
      regency: kost.regency || "",
      district: kost.district || "",
      village: kost.village || "",
      postal_code: kost.postal_code || "",
      provinceKode: "",
      regencyKode: "",
      districtKode: "",
      villageKode: "",
    });
  }, [kost]);

  const updateMut = useMutation({
    mutationFn: () =>
      dashboardApi.updateKost(id, {
        name: form.name,
        address: form.address,
        description: form.description,
        gender: form.gender as never,
        province: form.province || undefined,
        regency: form.regency || undefined,
        district: form.district || undefined,
        village: form.village || undefined,
        postal_code: form.postal_code || undefined,
        city: form.regency || form.province || undefined,
      } as never),
    onSuccess: () => {
      toast.success("Perubahan berhasil disimpan");
      qc.invalidateQueries({ queryKey: ["owner-kost", id] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || "Waduh, gagal menyimpan"),
  });

  // ---- Tambah kamar (form di atas) ----
  const [newRoom, setNewRoom] = useState({ room_number: "", price_monthly: 1000000 as number | string, luas: "" as number | string, facilities: "", photos: [] as string[], uploading: false });
  const resetRoom = () => setNewRoom({ room_number: "", price_monthly: 1000000, luas: "", facilities: "", photos: [], uploading: false });

  async function onRoomPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    for (const f of files) {
      if (f.size > 2 * 1024 * 1024) {
        toast.error("Ukuran foto maksimal 2MB ya");
        continue;
      }
      try {
        setNewRoom((s) => ({ ...s, uploading: true }));
        const url = await dashboardApi.uploadImage(f);
        setNewRoom((s) => ({ ...s, photos: [...s.photos, url] }));
      } catch {
        toast.error("Gagal mengunggah foto");
      }
    }
    setNewRoom((s) => ({ ...s, uploading: false }));
    e.target.value = "";
  }

  const createRoomMut = useMutation({
    mutationFn: () =>
      dashboardApi.createRoom(id, {
        room_number: newRoom.room_number,
        price_monthly: Number(newRoom.price_monthly),
        luas: newRoom.luas ? Number(newRoom.luas) : undefined,
        facilities: newRoom.facilities.split(",").map((s) => s.trim()).filter(Boolean),
        photos: newRoom.photos,
      } as never),
    onSuccess: () => {
      toast.success("Kamar baru berhasil ditambahkan!");
      qc.invalidateQueries({ queryKey: ["rooms", id] });
      resetRoom();
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || e.response?.data?.error?.details?.[0]?.message || "Gagal menambah kamar"),
  });

  const deleteRoomMut = useMutation({
    mutationFn: (roomId: string) => dashboardApi.deleteRoom(roomId),
    onSuccess: () => {
      toast.success("Kamar berhasil dihapus");
      qc.invalidateQueries({ queryKey: ["rooms", id] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || "Gagal hapus — hanya kamar kosong yang bisa dihapus"),
  });

  // Pagination kamar (client-side)
  const allRooms = rooms || [];
  const totalRoomPages = Math.max(1, Math.ceil(allRooms.length / ROOMS_PER_PAGE));
  const safePage = Math.min(roomPage, totalRoomPages);
  const pagedRooms = allRooms.slice((safePage - 1) * ROOMS_PER_PAGE, safePage * ROOMS_PER_PAGE);

  if (isLoading) return <div className="p-6"><Skeleton className="h-64 rounded-2xl" /></div>;
  if (!kost) return <div className="p-6 text-sm">Kost tidak ditemukan</div>;

  return (
    <div className="space-y-6 p-2 lg:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/dashboard/kosts" className="rounded-xl border bg-white px-3 py-1.5 text-sm hover:bg-zinc-50">← Kembali</Link>
        <h1 className="text-xl font-bold tracking-tight">{kost.name}</h1>
        <Badge tone={kost.status === "verified" ? "green" : kost.status === "pending" ? "amber" : "red"}>{kost.status}</Badge>
        {kost.status === "pending" && <span className="text-xs text-zinc-500">Sedang dicek oleh tim kami ya</span>}
      </div>

      {/* ===== Edit info kost ===== */}
      <Card className="border-0 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f5f0ff] text-[#8550e6]">✎</span>
          <h2 className="font-semibold">Ubah Info Kost</h2>
        </div>
        <div className="space-y-4">
          <Input label="Nama Kost *" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-700">Wilayah *</p>
            <WilayahSelect
              value={form}
              onChange={(v) => setForm((s) => ({ ...s, province: v.province, regency: v.regency, district: v.district, village: v.village, postal_code: v.postal_code, provinceKode: v.provinceKode || s.provinceKode, regencyKode: v.regencyKode || s.regencyKode, districtKode: v.districtKode || s.districtKode, villageKode: v.villageKode || s.villageKode }))}
            />
          </div>
          <Input label="Alamat Lengkap (nama jalan & nomor)" value={form.address} onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))} />
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-zinc-700">Ceritakan Tentang Kostmu</span>
            <textarea value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} className="min-h-[80px] w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-[#8550e6] focus:ring-2 focus:ring-[#ede5fe]" rows={3} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-zinc-700">Untuk Siapa?</span>
            <select value={form.gender} onChange={(e) => setForm((s) => ({ ...s, gender: e.target.value }))} className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#8550e6] focus:ring-2 focus:ring-[#ede5fe]">
              <option value="campur">Campur (Putra & Putri)</option>
              <option value="putra">Khusus Putra</option>
              <option value="putri">Khusus Putri</option>
            </select>
          </label>
          <Button onClick={() => setConfirm({ title: "Simpan perubahan?", desc: `Info kost "${form.name}" akan diperbarui`, tone: "violet", action: () => { updateMut.mutate(); setConfirm(null); } })} disabled={updateMut.isPending} className="w-full shadow-sm">{updateMut.isPending ? "Menyimpan..." : "Simpan Perubahan"}</Button>
        </div>
      </Card>

      {/* ===== Tambah kamar (di atas) ===== */}
      <Card className="border-0 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">🛏</span>
          <h2 className="font-semibold">Tambah Kamar Baru</h2>
        </div>

        <div className="rounded-xl border border-dashed bg-zinc-50 p-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Input label="Nomor Kamar *" value={newRoom.room_number} onChange={(e) => setNewRoom((s) => ({ ...s, room_number: e.target.value }))} placeholder="Contoh: A101" />
            <Input label="Harga / Bulan *" type="number" value={String(newRoom.price_monthly)} onChange={(e) => setNewRoom((s) => ({ ...s, price_monthly: e.target.value }))} placeholder="1000000" />
            <Input label="Luas (m²)" type="number" value={String(newRoom.luas)} onChange={(e) => setNewRoom((s) => ({ ...s, luas: e.target.value }))} placeholder="Contoh: 12" min={0} />
            <Input label="Fasilitas (pisah koma)" value={newRoom.facilities} onChange={(e) => setNewRoom((s) => ({ ...s, facilities: e.target.value }))} placeholder="ac, wifi, kasur" />
          </div>

          {/* Foto kamar — bisa banyak, foto pertama jadi thumbnail */}
          <div>
            <p className="text-sm font-medium">Foto Kamar</p>
            <p className="text-xs text-zinc-500">Bisa pilih beberapa foto sekaligus. Foto pertama otomatis jadi thumbnail.</p>
            <label className="mt-2 flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 bg-white px-4 py-4 text-sm hover:bg-zinc-50">
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={onRoomPhoto} disabled={newRoom.uploading} className="hidden" />
              {newRoom.uploading ? "Sedang mengunggah..." : "Klik di sini untuk pilih foto"}
            </label>
            {newRoom.photos.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2 md:grid-cols-6">
                {newRoom.photos.map((url, i) => (
                  <div key={i} className="group relative overflow-hidden rounded-xl border">
                    <img src={url} alt="" className="aspect-square w-full object-cover" />
                    {i === 0 && <span className="absolute left-1 top-1 rounded-full bg-[#8550e6] px-1.5 py-0.5 text-[10px] font-semibold text-white">Thumbnail</span>}
                    <button onClick={() => setNewRoom((s) => ({ ...s, photos: s.photos.filter((_, j) => j !== i) }))} className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-xs text-white opacity-0 group-hover:opacity-100">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button size="sm" className="w-full shadow-sm" disabled={!newRoom.room_number || createRoomMut.isPending || newRoom.uploading} onClick={() => setConfirm({ title: `Tambah kamar ${newRoom.room_number}?`, desc: `Rp ${Number(newRoom.price_monthly || 0).toLocaleString("id-ID")} / bulan${newRoom.luas ? ` • ${newRoom.luas} m²` : ""}`, tone: "violet", action: () => { createRoomMut.mutate(); setConfirm(null); } })}>
            {createRoomMut.isPending ? "Menyimpan..." : "+ Simpan Kamar"}
          </Button>
        </div>
      </Card>

      {/* ===== Daftar kamar (di bawah, ada pagination) ===== */}
      <Card className="border-0 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f5f0ff] text-[#8550e6]">📋</span>
          <h2 className="font-semibold">Daftar Kamar • {allRooms.length}</h2>
        </div>

        {roomsLoading ? (
          <Skeleton className="h-32 rounded-xl" />
        ) : !allRooms.length ? (
          <p className="py-8 text-center text-sm text-zinc-500">Belum ada kamar — tambahkan lewat form di atas ya</p>
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border">
              <TableRoot className="border-0">
                <TableHeader>
                  <TableRow className="bg-zinc-50/50">
                    <TableHead>Foto</TableHead>
                    <TableHead>Kamar</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead>Luas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dibuat</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedRooms.map((r: any) => (
                    <TableRow key={r.id} className="hover:bg-[#f5f0ff]/30">
                      <TableCell>
                        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg bg-zinc-100">
                          {r.photos?.[0] ? <img src={r.photos[0]} alt="" className="h-full w-full object-cover" /> : <span>🛏</span>}
                        </div>
                      </TableCell>
                      <TableCell><span className="font-mono text-sm font-semibold">{r.room_number}</span></TableCell>
                      <TableCell><span className="text-sm">Rp {Number(r.price_monthly).toLocaleString("id-ID")}</span></TableCell>
                      <TableCell><span className="text-sm">{r.luas ? `${Number(r.luas)} m²` : "-"}</span></TableCell>
                      <TableCell><Badge tone={r.status === "available" ? "green" : r.status === "reserved" ? "amber" : r.status === "occupied" ? "red" : "zinc"}>{r.status}</Badge></TableCell>
                      <TableCell><p className="text-xs text-zinc-500">{formatDateTime(r.created_at)}</p></TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1.5">
                          <Link href={`/kosts/${id}/kamar/${r.id}`} target="_blank"><Button variant="outline" size="sm">Detail</Button></Link>
                          <Button variant="outline" size="sm" disabled={deleteRoomMut.isPending} onClick={() => setConfirm({ title: `Hapus kamar ${r.room_number}?`, desc: "Hanya kamar kosong yang bisa dihapus. Tidak bisa dibatalkan!", tone: "red", action: () => { deleteRoomMut.mutate(r.id); setConfirm(null); } })}>Hapus</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </TableRoot>
            </div>

            {totalRoomPages > 1 && (
              <div className="flex items-center justify-between border-t bg-zinc-50/30 px-4 py-3">
                <p className="text-xs text-zinc-500">Halaman {safePage} dari {totalRoomPages} • {allRooms.length} kamar</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setRoomPage(safePage - 1)}>Sebelumnya</Button>
                  <Button variant="outline" size="sm" disabled={safePage >= totalRoomPages} onClick={() => setRoomPage(safePage + 1)}>Selanjutnya</Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <ConfirmDialog open={!!confirm} title={confirm?.title || ""} description={confirm?.desc} tone={confirm?.tone} confirmText="Ya, Lanjutkan" cancelText="Batal" onConfirm={() => confirm?.action()} onCancel={() => setConfirm(null)} />
    </div>
  );
}
