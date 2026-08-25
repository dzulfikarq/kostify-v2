"use client";

import { redirect } from "next/navigation";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardApi } from "@/services/api/dashboard";
import { useMe } from "@/hooks/useAuth";
import { Card, Skeleton } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
import { TableRoot, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/tailgrids/core/table";
import { Input } from "@/components/ui/input";
import { WilayahSelect } from "@/components/kost/WilayahSelect";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatDateTime } from "@/utils/date";
import { useLang } from '@/i18n';
import { toast } from 'sonner';

export default function MasterKostPage() {
  const { t } = useLang();
  const { data: user } = useMe();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<null | { id: string; name: string; city: string; address: string; description: string }>(null);
  const [confirm, setConfirm] = useState<null | { title: string; desc: string; action: () => void; tone?: "violet" | "red" }>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", province: "", regency: "", district: "", village: "", postal_code: "", address: "", gender: "campur", provinceKode: "", regencyKode: "", districtKode: "", villageKode: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["master-kosts", search],
    queryFn: () => dashboardApi.listAdminKosts({ search: search || undefined, limit: 50 }),
    enabled: user?.role === "super_admin",
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["master-kosts"] });

  const deleteMut = useMutation({
    mutationFn: (id: string) => dashboardApi.deleteAdminKost(id),
    onSuccess: () => { toast.success("Kost dihapus"); invalidate(); },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || "Gagal hapus"),
  });
  const updateMut = useMutation({
    mutationFn: () => dashboardApi.updateAdminKost(editing!.id, { name: editing!.name, city: editing!.city, address: editing!.address, description: editing!.description } as never),
    onSuccess: () => { toast.success("Kost diperbarui"); setEditing(null); invalidate(); },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || "Gagal update"),
  });
  const createMut = useMutation({
    mutationFn: () => dashboardApi.createAdminKost({ name: createForm.name, province: createForm.province, regency: createForm.regency, district: createForm.district, village: createForm.village, postal_code: createForm.postal_code, city: createForm.regency || createForm.province, address: createForm.address, gender: createForm.gender as never } as never),
    onSuccess: () => {
      toast.success("Kost dibuat (verified & aktif)");
      setShowCreate(false);
      setCreateForm({ name: "", province: "", regency: "", district: "", village: "", postal_code: "", address: "", gender: "campur", provinceKode: "", regencyKode: "", districtKode: "", villageKode: "" });
      invalidate();
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || "Gagal buat kost"),
  });
  const toggleMut = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => dashboardApi.toggleKostActive(id, is_active),
    onSuccess: () => { toast.success("Status aktif diperbarui"); invalidate(); },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || "Gagal toggle"),
  });

  if (user && user.role !== "super_admin") redirect("/403");

  return (
    <div className="space-y-5 p-2 lg:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">{t("mk.judul")}</h1>
          <p className="text-sm text-zinc-500">Semua kost terdaftar di aplikasi — kelola status, edit, dan hapus. Semua aksi butuh konfirmasi.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="shadow-sm">{t("mk.tambah")}</Button>
      </div>

      <Card className="p-4">
        <Input placeholder={t('kost.cari_ph')} value={search} onChange={(e) => setSearch(e.target.value)} />
      </Card>

      {isLoading ? (
        <Card className="p-0 overflow-hidden"><Skeleton className="h-64" /></Card>
      ) : !data?.items.length ? (
        <EmptyState title="Belum ada kost" description={search ? `Tidak ada kost cocok "${search}"` : "Belum ada kost terdaftar di aplikasi"} />
      ) : (
        <Card className="p-0 overflow-hidden border-0 shadow-sm">
          <TableRoot>
            <TableHeader>
              <TableRow className="bg-zinc-50/50">
                <TableHead>{t("kost.kolom.kost")}</TableHead>
                <TableHead>{t("mk.owner")}</TableHead>
                <TableHead>{t("bk.kolom.status")}</TableHead>
                <TableHead>{t("c.aktif")}</TableHead>
                <TableHead>{t("mk.dibuat")}</TableHead>
                <TableHead className="text-right">{t("kost.kolom.aksi")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((k: any) => (
                <TableRow key={k.id} className="hover:bg-[#f5f0ff]/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#8550e6] to-[#4f46e5] text-sm font-bold text-white">{k.name.charAt(0).toUpperCase()}</div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{k.name}</p>
                        <p className="truncate text-xs text-zinc-500">{[k.village, k.district, k.regency].filter(Boolean).join(", ") || k.city}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><p className="text-xs text-zinc-500">{k.owner?.email || "-"}</p></TableCell>
                  <TableCell><Badge tone={k.status === "verified" ? "green" : k.status === "pending" ? "amber" : "red"}>{k.status}</Badge></TableCell>
                  <TableCell>
                    <button onClick={() => setConfirm({ title: k.is_active ? t("mk.cd_nonaktif") : t("mk.cd_aktif"), desc: k.is_active ? t("mk.cd_nonaktif_desc") : t("mk.cd_aktif_desc"), tone: k.is_active ? "red" : "violet", action: () => { toggleMut.mutate({ id: k.id, is_active: !k.is_active }); setConfirm(null); } })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${k.is_active ? "bg-[#8550e6]" : "bg-zinc-200"}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${k.is_active ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </TableCell>
                  <TableCell><p className="text-xs text-zinc-500">{formatDateTime(k.created_at)}</p></TableCell>
                  <TableCell>
                    <div className="flex flex-wrap justify-end gap-1">
                      <Link href={`/kosts/${k.id}`} target="_blank"><Button variant="outline" size="sm">{t("c.detail")}</Button></Link>
                      <Button variant="outline" size="sm" onClick={() => setEditing({ id: k.id, name: k.name, city: k.city, address: k.address || "", description: k.description || "" })}>{t("c.edit")}</Button>
                      <Button variant="outline" size="sm" onClick={() => setConfirm({ title: t("mk.cd_hapus", { name: k.name }), desc: t("mk.cd_hapus_desc"), tone: "red", action: () => { deleteMut.mutate(k.id); setConfirm(null); } })} className="text-red-600 hover:bg-red-50">{t("c.hapus")}</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </TableRoot>
        </Card>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md space-y-3 border-0 shadow-xl">
            <h3 className="font-semibold">{t("mgr.edit_judul")}</h3>
            <Input label={t("pf.nama")} value={editing.name} onChange={(e) => setEditing((s) => s && { ...s, name: e.target.value })} />
            <Input label={t("kost.kolom.kota")} value={editing.city} onChange={(e) => setEditing((s) => s && { ...s, city: e.target.value })} />
            <Input label="Alamat" value={editing.address} onChange={(e) => setEditing((s) => s && { ...s, address: e.target.value })} />
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-zinc-700">Deskripsi</span>
              <textarea value={editing.description} onChange={(e) => setEditing((s) => s && { ...s, description: e.target.value })} rows={3} className="min-h-[80px] w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#8550e6] focus:ring-2 focus:ring-[#ede5fe]" />
            </label>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditing(null)}>{t("c.batal")}</Button>
              <Button className="flex-1" disabled={updateMut.isPending || editing.name.trim().length < 3} onClick={() => setConfirm({ title: t("mgr.cd_simpan"), desc: editing.name, tone: "violet", action: () => { updateMut.mutate(); setConfirm(null); } })}>{t("c.simpan")}</Button>
            </div>
          </Card>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm overflow-y-auto">
          <Card className="my-8 w-full max-w-lg space-y-3 border-0 shadow-xl">
            <h3 className="font-semibold">{t("cmn.judul")}</h3>
            <p className="text-xs text-zinc-500">Langsung verified & aktif — master wilayah dari API</p>
            <Input label="Nama Kost *" value={createForm.name} onChange={(e) => setCreateForm((s) => ({ ...s, name: e.target.value }))} placeholder="Kost Admin" />
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Wilayah *</p>
              <WilayahSelect value={createForm as never} onChange={(v) => setCreateForm((s) => ({ ...s, province: v.province, regency: v.regency, district: v.district, village: v.village, postal_code: v.postal_code, provinceKode: v.provinceKode || "", regencyKode: v.regencyKode || "", districtKode: v.districtKode || "", villageKode: v.villageKode || "" }))} />
            </div>
            <Input label={t("new.alamat")} value={createForm.address} onChange={(e) => setCreateForm((s) => ({ ...s, address: e.target.value }))} placeholder="Jl. Merdeka No. 10" />
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Gender</span>
              <select value={createForm.gender} onChange={(e) => setCreateForm((s) => ({ ...s, gender: e.target.value }))} className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm">
                <option value="campur">Campur</option>
                <option value="putra">Putra</option>
                <option value="putri">Putri</option>
              </select>
            </label>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>{t("c.batal")}</Button>
              <Button className="flex-1" disabled={createMut.isPending || !createForm.name || !createForm.province || !createForm.regency || !createForm.district || !createForm.village || !createForm.postal_code} onClick={() => setConfirm({ title: t("new.cd_title"), desc: `${createForm.name} — ${createForm.village}, ${createForm.district}, ${createForm.regency}`, tone: "violet", action: () => { createMut.mutate(); setConfirm(null); } })}>{t("kost.buat")}</Button>
            </div>
          </Card>
        </div>
      )}

      <ConfirmDialog open={!!confirm} title={confirm?.title || ""} description={confirm?.desc} tone={confirm?.tone} confirmText={t("c.konfirmasi")} onConfirm={() => confirm?.action()} onCancel={() => setConfirm(null)} />
    </div>
  );
}
