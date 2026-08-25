"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardApi } from "@/services/api/dashboard";
import { useMe } from "@/hooks/useAuth";
import { Card, Skeleton } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    mutationFn: ({id, body}:{id:string,body:any}) => dashboardApi.updateUser(id, body),
    onSuccess: () => { toast.success("User diperbarui"); qc.invalidateQueries({ queryKey: ["admin-users"] }); },
    onError: (e:any)=>toast.error(e.response?.data?.error?.message||"Gagal"),
  });

  if (me && me.role !== "super_admin") return <div className="p-6 text-sm">Hanya super admin</div>;

  return (
    <div className="space-y-4 p-2 lg:p-6">
      <h1 className="text-xl font-bold">Kelola Users</h1>
      <div className="flex gap-2">
        <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Cari nama/email..." className="flex-1 rounded-xl border px-3 py-2 text-sm" />
      </div>
      {isLoading ? <Skeleton className="h-40" /> : !data?.items?.length ? <Card className="text-center text-sm text-zinc-500">Tidak ada user</Card> : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
              <tr><th className="px-4 py-2">Nama</th><th className="px-4 py-2">Email</th><th className="px-4 py-2">Role</th><th className="px-4 py-2">Aktif</th><th className="px-4 py-2">Aksi</th></tr>
            </thead>
            <tbody>
              {data.items.map((u:any)=>(
                <tr key={u.id} className="border-t">
                  <td className="px-4 py-2">{u.name}</td>
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2"><Badge tone={u.role==="super_admin"?"amber":u.role==="owner"?"blue":"zinc"}>{u.role}</Badge></td>
                  <td className="px-4 py-2">{u.is_active ? "Ya" : "Tidak"}</td>
                  <td className="px-4 py-2 flex gap-1">
                    <Button variant="outline" size="sm" onClick={()=>updateMut.mutate({id:u.id, body:{is_active: !u.is_active}})}>{u.is_active?"Nonaktifkan":"Aktifkan"}</Button>
                    <select value={u.role} onChange={(e)=>updateMut.mutate({id:u.id, body:{role:e.target.value}})} className="rounded-xl border px-2 py-1 text-xs">
                      <option value="tenant">tenant</option><option value="owner">owner</option><option value="super_admin">super_admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
