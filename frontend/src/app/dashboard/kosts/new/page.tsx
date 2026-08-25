"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { dashboardApi } from "@/services/api/dashboard";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WilayahSelect } from "@/components/kost/WilayahSelect";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useLang } from "@/i18n";
import { toast } from "sonner";
import Link from "next/link";

export default function NewKostPage() {
  const router = useRouter();
  const { t } = useLang();
  const [form, setForm] = useState({ name: "", address: "", description: "", gender: "campur", facilities: "", photos: [] as string[], province: "", regency: "", district: "", village: "", postal_code: "", provinceKode: "", regencyKode: "", districtKode: "", villageKode: "" });
  const [uploading, setUploading] = useState(false);
  const [confirm, setConfirm] = useState<null | { title: string; desc: string; action: () => void; tone?: "violet" | "red" }>(null);

  const mut = useMutation({
    mutationFn: () =>
      dashboardApi.createKost({
        name: form.name,
        city: form.regency || form.province,
        province: form.province,
        regency: form.regency,
        district: form.district,
        village: form.village,
        postal_code: form.postal_code,
        address: form.address,
        description: form.description,
        gender: form.gender as never,
        facilities: form.facilities.split(",").map((s) => s.trim()).filter(Boolean),
        photos: form.photos,
      } as never),
    onSuccess: () => {
      toast.success(t("new.sukses"));
      router.push("/dashboard/kosts");
    },
    onError: (e: any) => {
      const msg = e.response?.data?.error?.message || e.response?.data?.error?.details?.[0]?.message || "Gagal mengajukan kost";
      toast.error(msg);
    },
  });

  const canSubmit = form.name.length >= 3 && form.province && form.regency && form.district && form.village && form.postal_code;
  const nameErr = form.name && form.name.length < 3 ? "Minimal 3 karakter" : "";

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) return toast.error(t("new.maks2mb"));
    setUploading(true);
    try {
      const url = await dashboardApi.uploadImage(f);
      setForm((s) => ({ ...s, photos: [...s.photos, url] }));
      toast.success(t("new.foto_ok"));
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
          <h1 className="text-lg font-semibold tracking-tight">{t("new.judul")}</h1>
          <p className="text-sm text-zinc-500">Isi detail kost — akan diverifikasi admin sebelum tayang di pencarian.</p>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f5f0ff] text-[#8550e6]">🏠</span>
          <h2 className="font-semibold">{t("new.info")}</h2>
          <Badge tone="zinc" className="ml-auto">{t("new.badge")}</Badge>
        </div>

        <Input label={t("new.nama")} value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} placeholder={t("new.nama_ph")} error={nameErr} />
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-zinc-700">{t("new.wilayah")}</p>
          <WilayahSelect
            value={form}
            onChange={(v) => setForm((s) => ({ ...s, province: v.province, regency: v.regency, district: v.district, village: v.village, postal_code: v.postal_code, provinceKode: v.provinceKode || "", regencyKode: v.regencyKode || "", districtKode: v.districtKode || "", villageKode: v.villageKode || "" }))}
          />
        </div>
        <Input label={t("new.alamat")} value={form.address} onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))} placeholder={t("new.alamat_ph")} className="mt-4" />
        <label className="mt-4 block space-y-1.5">
          <span className="text-sm font-medium text-zinc-700">{t("new.deskripsi")}</span>
          <textarea
            value={form.description}
            onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
            placeholder={t("new.deskripsi_ph")}
            className="min-h-[90px] w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-[#8550e6] focus:ring-2 focus:ring-[#ede5fe]"
            rows={3}
          />
        </label>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-zinc-700">{t("new.peruntukan")}</span>
            <select value={form.gender} onChange={(e) => setForm((s) => ({ ...s, gender: e.target.value }))} className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#8550e6] focus:ring-2 focus:ring-[#ede5fe]">
              <option value="campur">Campur</option>
              <option value="putra">Putra</option>
              <option value="putri">Putri</option>
            </select>
          </label>
          <Input label={t("new.fasilitas")} value={form.facilities} onChange={(e) => setForm((s) => ({ ...s, facilities: e.target.value }))} placeholder={t("new.fasilitas_ph")} />
        </div>

        <div className="mt-4">
          <span className="text-sm font-medium text-zinc-700">{t("new.foto")}</span>
          <p className="text-xs text-zinc-500">{t("new.foto_sub")}</p>
          <label className="mt-2 flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 px-4 py-6 text-sm hover:bg-zinc-100">
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} disabled={uploading} className="hidden" />
            {uploading ? t("new.upload") : t("new.foto_pilih")}
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
          <Button variant="outline" className="flex-1" onClick={() => router.back()}>{t("c.batal")}</Button>
          <Button disabled={!canSubmit || mut.isPending || uploading} onClick={() => setConfirm({ title: t("new.cd_title"), desc: `${form.village}, ${form.district}, ${form.regency} ${form.postal_code}`, tone: "violet", action: () => { mut.mutate(); setConfirm(null); } })} className="flex-1 shadow-sm">
            {mut.isPending ? t("new.mengajukan") : t("new.ajukan")}
          </Button>
        </div>
      </Card>

      <ConfirmDialog open={!!confirm} title={confirm?.title || ""} description={confirm?.desc} tone={confirm?.tone} confirmText={t("c.konfirmasi")} onConfirm={() => confirm?.action()} onCancel={() => setConfirm(null)} />
    </div>
  );
}
