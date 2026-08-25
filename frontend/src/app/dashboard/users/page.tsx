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
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", search],
    queryFn: () => dashboardApi.listUsers({ search: search || undefined, limit: 20 }),
    enabled: me?.role === "super_admin",
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => dashboardApi.updateUser(id, body),
    onSuccess: () => {
      toast.success("User diperbarui");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || "Gagal"),
  });

  if (me && me.role !== "super_admin") return <div className="p-6 text-sm">Hanya super admin</div>;

  return (
    <div className="space-y-5 p-2 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kelola Users</h1>
        <p className="text-sm text-zinc-500">Cari, ubah role, atau nonaktifkan akun — hati-hati mengubah super_admin</p>
      </div>

      <Card className="p-4">
        <div className="flex gap-2">
          <Input placeholder="Cari nama / email..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
          {search && <Button variant="outline" onClick={() => setSearch("")}>Reset</Button>}
        </div>
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
                <TableHead>Email</TableHead>
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
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#8550e6] to-[#4f46e5] text-xs font-bold text-white">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium">{u.name}</span>
                    </div>
                  </TableCell>
                  <TableCell><span className="text-sm text-zinc-600">{u.email}</span></TableCell>
                  <TableCell><Badge tone={u.role === "super_admin" ? "amber" : u.role === "owner" ? "blue" : "zinc"}>{u.role}</Badge></TableCell>
                  <TableCell>
                    <Badge tone={u.is_active ? "green" : "red"}>{u.is_active ? "Aktif" : "Nonaktif"}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1.5">
                      <Button variant="outline" size="sm" onClick={() => updateMut.mutate({ id: u.id, body: { is_active: !u.is_active } })} className="text-xs">
                        {u.is_active ? "Nonaktifkan" : "Aktifkan"}
                      </Button>
                      <select value={u.role} onChange={(e) => updateMut.mutate({ id: u.id, body: { role: e.target.value } })} className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium outline-none focus:border-[#8550e6]">
                        <option value="tenant">tenant</option>
                        <option value="owner">owner</option>
                        <option value="super_admin">super_admin</option>
                      </select>
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
