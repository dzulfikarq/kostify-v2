"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMe, useLogout } from "@/hooks/useAuth";
import { dashboardApi } from "@/services/api/dashboard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateTime } from "@/utils/date";
import { useLang } from '@/i18n';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { t } = useLang();
  const { data: user, isLoading } = useMe();
  const logout = useLogout();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", gender: "" });

  useEffect(() => {
    if (user) setForm({ name: user.name, phone: user.phone || "", gender: user.gender || "" });
  }, [user]);

  const saveMut = {
    isPending: false,
    mutate: async () => {
      try {
        await dashboardApi.updateProfile({ name: form.name.trim(), phone: form.phone.trim(), gender: form.gender });
        toast.success(t("pf.sukses"));
        setEditing(false);
        qc.invalidateQueries({ queryKey: ["me"] });
      } catch (e: any) {
        toast.error(e.response?.data?.error?.message || t('c.gagal'));
      }
    },
  };

  if (isLoading) return <div className="p-6 text-sm text-zinc-500">{t("c.muat")}</div>;
  if (!user) return <div className="p-6 text-sm">{t("mb.login_first")}</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-2 lg:p-6">
      <h1 className="text-xl font-bold">{t("pf.judul")}</h1>
      <Card className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#8550e6] to-[#4f46e5] text-white text-lg font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold">{user.name}</p>
            <p className="text-sm text-zinc-500">{user.email}</p>
          </div>
          <Badge tone={user.role === "owner" ? "blue" : user.role === "super_admin" ? "amber" : "zinc"} className="ml-auto">
            {user.role}
          </Badge>
        </div>

        {editing ? (
          <div className="space-y-3 border-t pt-3">
            <Input label={t("pf.nama")} value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
            <Input label={t("pf.telepon")} value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} placeholder="0812..." inputMode="tel" />
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-zinc-700">Jenis Kelamin</span>
              <select value={form.gender} onChange={(e) => setForm((s) => ({ ...s, gender: e.target.value }))} className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm">
                <option value="">Pilih (opsional)</option>
                <option value="laki-laki">Laki-laki</option>
                <option value="perempuan">Perempuan</option>
              </select>
            </label>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setEditing(false); setForm({ name: user.name, phone: user.phone || "", gender: user.gender || "" }); }}>{t("c.batal")}</Button>
              <Button className="flex-1 shadow-sm" disabled={form.name.trim().length < 2} onClick={() => saveMut.mutate()}>{t("c.simpan")}</Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-2 border-t pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">{t("pf.telepon")}</span>
              <span>{user.phone || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Jenis Kelamin</span>
              <span>{user.gender ? (user.gender === "laki-laki" ? "Laki-laki" : "Perempuan") : "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">{t("ud.status")}</span>
              <span>{user.is_active ? "Aktif" : "Nonaktif"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">{t("pf.bergabung")}</span>
              <span>{formatDateTime(user.created_at)}</span>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {!editing && (
            <Button variant="outline" className="flex-1" onClick={() => setEditing(true)}>
              Edit Profil
            </Button>
          )}
          <Button variant="ghost" className={`flex-1 text-red-600 hover:bg-red-50 ${editing ? "hidden" : ""}`} onClick={() => logout.mutate()} disabled={logout.isPending}>
            {logout.isPending ? t("pf.logging_out") : t("pf.logout")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
