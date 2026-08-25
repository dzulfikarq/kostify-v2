"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { dashboardApi } from "@/services/api/dashboard";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
      toast.success("Kost diajukan, menunggu verifikasi");
      router.push("/dashboard/kosts");
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || "Gagal"),
  });

  const canSubmit = form.name.length >= 3 && form.city.length >= 2;

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const url = await dashboardApi.uploadImage(f);
      setForm((s) => ({ ...s, photos: [...s.photos, url] }));
      toast.success("Foto terupload");
    } catch {
      toast.error("Upload gagal");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-2 lg:p-6">
      <h1 className="text-xl font-bold">Tambah Kost</h1>
      <Card className="space-y-4">
        <Input label="Nama Kost" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} placeholder="Kost Bahagia" />
        <Input label="Kota" value={form.city} onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))} placeholder="Jakarta" />
        <Input label="Alamat" value={form.address} onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))} placeholder="Jl. ..." />
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Deskripsi</span>
          <textarea value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm" rows={3} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Gender</span>
          <select value={form.gender} onChange={(e) => setForm((s) => ({ ...s, gender: e.target.value }))} className="w-full rounded-xl border px-3 py-2 text-sm">
            <option value="campur">Campur</option>
            <option value="putra">Putra</option>
            <option value="putri">Putri</option>
          </select>
        </label>
        <Input label="Fasilitas (pisah koma: wifi, ac, parkir)" value={form.facilities} onChange={(e) => setForm((s) => ({ ...s, facilities: e.target.value }))} placeholder="wifi, ac" />
        <div>
          <span className="text-sm font-medium">Foto</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} disabled={uploading} className="mt-1 block text-sm" />
          {form.photos.length > 0 && <p className="mt-1 text-xs text-zinc-500">{form.photos.length} foto terupload</p>}
        </div>
        <Button disabled={!canSubmit || mut.isPending || uploading} onClick={() => mut.mutate()} className="w-full">
          {mut.isPending ? "Menyimpan..." : "Ajukan Kost"}
        </Button>
      </Card>
    </div>
  );
}
