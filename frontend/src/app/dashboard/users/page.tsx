"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardApi } from "@/services/api/dashboard";
import { useMe } from "@/hooks/useAuth";
import { Card, Skeleton } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TableRoot, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/tailgrids/core/table";
import { toast } from "sonner";
import { useState } from "react";

export default function UsersPage() {
  const { data: me } = useMe();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "tenant", phone: "" });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", search],
    queryFn: () => dashboardApi.listUsers({ search: search || undefined, limit: 20 }),
    enabled: me?.role === "super_admin",
  });

  const createMut = useMutation({
    mutationFn: () => dashboardApi.createUser(form),
    onSuccess: () => {
      toast.success("User dibuat");
      setShowCreate(false);
      setForm({ name: "", email: "", password: "", role: "tenant", phone: "" });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || e.response?.data?.error?.details?.[0]?.message || "Gagal buat user"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => dashboardApi.updateUser(id, body),
    onSuccess: () => {
      toast.success("User diperbarui");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || "Gagal update"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => dashboardApi.deleteUser(id),
    onSuccess: () => {
      toast.success("User dihapus");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || "Gagal hapus"),
  });

  if (me && me.role !== "super_admin") return <div className="p-6 text-sm">Hanya super admin</div>;

  return (
    <div className="space-y-5 p-2 lg:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kelola Users</h1>
          <p className="text-sm text-zinc-500">CRUD user — semua aksi butuh konfirmasi</p>
        </div>
        <Button onClick={() => setShowCreate((v) => !v)} className="shadow-sm">+ Buat User</Button>
      </div>

      {showCreate && (
        <Card className="border-0 shadow-sm space-y-3">
          <h3 className="font-semibold">Buat User Baru</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <Input label="Nama *" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} placeholder="Nama lengkap" />
            <Input label="Email *" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} placeholder="email@test.local" />
            <Input label="Password *" type="password" value={form.password} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} placeholder="Min 8 karakter" />
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Role</span>
              <select value={form.role} onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))} className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#8550e6] focus:ring-2 focus:ring-[#ede5fe] outline-none">
                <option value="tenant">tenant</option>
                <option value="owner">owner</option>
                <option value="super_admin">super_admin</option>
              </select>
            </label>
            <Input label="Phone" value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} placeholder="0812..." />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>Batal</Button>
            <Button className="flex-1 shadow-sm" disabled={createMut.isPending} onClick={() => { if (!confirm(`Buat user ${form.email} sebagai ${form.role}?`)) return; createMut.mutate(); }}>{createMut.isPending ? "Membuat..." : "Buat User"}</Button>
          </div>
        </Card>
      )}

      <Card className="p-4">
        <Input placeholder="Cari nama / email..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </Card>

      {isLoading ? (
        <Card className="p-0 overflow-hidden"><Skeleton className="h-64" /></Card>
      ) : !data?.items?.length ? (
        <Card className="py-12 text-center text-sm text-zinc-500">Tidak ada user</Card>
      ) : (
        <Card className="p-0 overflow-hidden border-0 shadow-sm">
          <TableRoot>
            <TableHeader>
              <TableRow className="bg-zinc-50/50">
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((u: any) => (
                <TableRow key={u.id} className="hover:bg-[#f5f0ff]/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#8550e6] to-[#4f46e5] text-xs font-bold text-white">{u.name.charAt(0).toUpperCase()}</div>
                      <div>
                        <p className="text-sm font-medium">{u.name}</p>
                        <p className="text-xs text-zinc-500">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <select value={u.role} onChange={(e) => { const v = e.target.value; if (!confirm(`Ubah role ${u.email} menjadi ${v}?`)) { e.target.value = u.role; return; } updateMut.mutate({ id: u.id, body: { role: v } }); }} className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium outline-none focus:border-[#8550e6]">
                      <option value="tenant">tenant</option>
                      <option value="owner">owner</option>
                      <option value="super_admin">super_admin</option>
                    </select>
                  </TableCell>
                  <TableCell><Badge tone={u.is_active ? "green" : "red"}>{u.is_active ? "Aktif" : "Nonaktif"}</Badge></TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1.5">
                      <Button variant="outline" size="sm" onClick={() => { if (!confirm(`${u.is_active ? "Nonaktifkan" : "Aktifkan"} user ${u.email}?`)) return; updateMut.mutate({ id: u.id, body: { is_active: !u.is_active } }); }}>{u.is_active ? "Nonaktifkan" : "Aktifkan"}</Button>
                      <Button variant="outline" size="sm" onClick={() => { if (!confirm(`Hapus user ${u.email}? Tidak bisa dibatalkan!`)) return; deleteMut.mutate(u.id); }} className="text-red-600 hover:bg-red-50">Hapus</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </TableRoot>
        </Card>
      )}
    </div>
  );
}
