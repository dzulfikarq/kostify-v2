"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { dashboardApi } from "@/services/api/dashboard";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";

export default function NewKostPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", city: "", address: "", description: "", gender: "campur", facilities: "", photos: [] as string[] });
  const [uploading, setUploading] = useState(false);

  const mut = useMutation({
    mutationFn: () =>
      dashboardApi.createKost({
        name: form.name,
        city: form.city,
        address: form.address,
        description: form.description,
        gender: form.gender as never,
        facilities: form.facilities.split(",").map((s) => s.trim()).filter(Boolean),
        photos: form.photos,
      } as never),
    onSuccess: () => {
      toast.success("Kost diajukan, menunggu verifikasi admin");
      router.push("/dashboard/kosts");
    },
    onError: (e: any) => {
      const msg = e.response?.data?.error?.message || e.response?.data?.error?.details?.[0]?.message || "Gagal mengajukan kost";
      toast.error(msg);
    },
  });

  const canSubmit = form.name.length >= 3 && form.city.length >= 2;
  const nameErr = form.name && form.name.length < 3 ? "Minimal 3 karakter" : "";
  const cityErr = form.city && form.city.length < 2 ? "Minimal 2 karakter" : "";

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) return toast.error("Maks 2MB");
    setUploading(true);
    try {
      const url = await dashboardApi.uploadImage(f);
      setForm((s) => ({ ...s, photos: [...s.photos, url] }));
      toast.success("Foto terupload");
    } catch {
      toast.error("Upload gagal — pastikan jpeg/png/webp");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-2 lg:p-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/kosts" className="rounded-xl border bg-white px-3 py-1.5 text-sm hover:bg-zinc-50">← Kembali</Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tambah Kost Baru</h1>
          <p className="text-sm text-zinc-500">Isi detail kost — akan diverifikasi admin sebelum tayang di pencarian.</p>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f5f0ff] text-[#8550e6]">🏠</span>
          <h2 className="font-semibold">Informasi Kost</h2>
          <Badge tone="zinc" className="ml-auto">Pending verifikasi setelah submit</Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Nama Kost *" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} placeholder="Kost Bahagia" error={nameErr} />
          <Input label="Kota *" value={form.city} onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))} placeholder="Jakarta" error={cityErr} />
        </div>
        <Input label="Alamat Lengkap" value={form.address} onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))} placeholder="Jl. Merdeka No. 123, dekat kampus" className="mt-4" />
        <label className="mt-4 block space-y-1.5">
          <span className="text-sm font-medium text-zinc-700">Deskripsi</span>
          <textarea
            value={form.description}
            onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
            placeholder="Ceritakan keunggulan kost: akses, lingkungan, peraturan..."
            className="min-h-[90px] w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-[#8550e6] focus:ring-2 focus:ring-[#ede5fe]"
            rows={3}
          />
        </label>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-zinc-700">Peruntukan</span>
            <select value={form.gender} onChange={(e) => setForm((s) => ({ ...s, gender: e.target.value }))} className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#8550e6] focus:ring-2 focus:ring-[#ede5fe]">
              <option value="campur">Campur</option>
              <option value="putra">Putra</option>
              <option value="putri">Putri</option>
            </select>
          </label>
          <Input label="Fasilitas (pisah koma)" value={form.facilities} onChange={(e) => setForm((s) => ({ ...s, facilities: e.target.value }))} placeholder="wifi, ac, parkir, dapur" />
        </div>

        <div className="mt-4">
          <span className="text-sm font-medium text-zinc-700">Foto Kost</span>
          <p className="text-xs text-zinc-500">JPG/PNG/WebP, maks 2MB per foto. Upload beberapa foto untuk galeri.</p>
          <label className="mt-2 flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 px-4 py-6 text-sm hover:bg-zinc-100">
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} disabled={uploading} className="hidden" />
            {uploading ? "Mengupload..." : "Pilih foto atau drag ke sini"}
          </label>
          {form.photos.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2 md:grid-cols-4">
              {form.photos.map((url, i) => (
                <div key={i} className="group relative overflow-hidden rounded-xl border">
                  <img src={url} alt="" className="aspect-square w-full object-cover" />
                  <button onClick={() => setForm((s) => ({ ...s, photos: s.photos.filter((_, j) => j !== i) }))} className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-xs text-white opacity-0 group-hover:opacity-100">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => router.back()}>Batal</Button>
          <Button disabled={!canSubmit || mut.isPending || uploading} onClick={() => mut.mutate()} className="flex-1 shadow-sm">
            {mut.isPending ? "Mengajukan..." : "Ajukan Kost"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
