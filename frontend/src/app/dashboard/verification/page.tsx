"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardApi } from "@/services/api/dashboard";
import { useMe } from "@/hooks/useAuth";
import { Card, Skeleton } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
import { TableRoot, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/tailgrids/core/table";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useState } from "react";

export default function VerificationPage() {
  const { data: user } = useMe();
  const qc = useQueryClient();
  const [status, setStatus] = useState("pending");
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<null | { id: string; name: string; city: string }>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-kosts", status],
    queryFn: () => dashboardApi.listAdminKosts({ status: status || undefined, limit: 20 }),
    enabled: user?.role === "super_admin",
  });

  const verifyMut = useMutation({
    mutationFn: (id: string) => dashboardApi.verifyKost(id),
    onSuccess: () => {
      toast.success("Kost diverifikasi — kini tayang di pencarian");
      qc.invalidateQueries({ queryKey: ["admin-kosts"] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || "Gagal verifikasi"),
  });
  const rejectMut = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => dashboardApi.rejectKost(id, note),
    onSuccess: () => {
      toast.success("Kost ditolak");
      qc.invalidateQueries({ queryKey: ["admin-kosts"] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || "Gagal menolak"),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => dashboardApi.deleteAdminKost(id),
    onSuccess: () => {
      toast.success("Kost dihapus");
      qc.invalidateQueries({ queryKey: ["admin-kosts"] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || "Gagal hapus"),
  });
  const updateMut = useMutation({
    mutationFn: () => dashboardApi.updateAdminKost(editing!.id, { name: editing!.name, city: editing!.city } as never),
    onSuccess: () => {
      toast.success("Kost diperbarui");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin-kosts"] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || "Gagal update"),
  });

  if (user && user.role !== "super_admin") return <div className="p-6 text-sm">Hanya super admin</div>;

  return (
    <div className="space-y-5 p-2 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kelola Kost (Admin)</h1>
        <p className="text-sm text-zinc-500">CRUD kost — verifikasi, edit, hapus. Konfirmasi sebelum aksi destruktif.</p>
      </div>

      <div className="flex gap-1.5 overflow-x-auto">
        {[
          { label: "Pending", value: "pending" },
          { label: "Verified", value: "verified" },
          { label: "Rejected", value: "rejected" },
          { label: "Semua", value: "" },
        ].map((s) => (
          <button key={s.value} onClick={() => setStatus(s.value)} className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition ${status === s.value ? "bg-[#8550e6] text-white shadow-sm" : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}>{s.label}</button>
        ))}
      </div>

      {isLoading ? (
        <Card className="p-0 overflow-hidden"><Skeleton className="h-64" /></Card>
      ) : !data?.items.length ? (
        <EmptyState title="Tidak ada kost" description={status ? `Tidak ada kost dengan status ${status}` : "Belum ada kost"} />
      ) : (
        <Card className="p-0 overflow-hidden border-0 shadow-sm">
          <TableRoot>
            <TableHeader>
              <TableRow className="bg-zinc-50/50">
                <TableHead>Kost</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Kota</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((k: any) => (
                <TableRow key={k.id} className="hover:bg-[#f5f0ff]/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f5f0ff] text-[#8550e6] text-sm">🏠</div>
                      <div>
                        <p className="text-sm font-medium">{k.name}</p>
                        <p className="text-xs text-zinc-500">{k.address?.slice(0, 40) || "-"}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{k.owner?.name || "-"}</p>
                    <p className="text-xs text-zinc-500">{k.owner?.email}</p>
                  </TableCell>
                  <TableCell><Badge tone="zinc">{k.city}</Badge> <span className="ml-1 text-xs text-zinc-500">{k.gender}</span></TableCell>
                  <TableCell><Badge tone={k.status === "verified" ? "green" : k.status === "pending" ? "amber" : "red"}>{k.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {k.status === "pending" && (
                        <>
                          <Button size="sm" onClick={() => { if (!confirm(`Verifikasi kost "${k.name}"?`)) return; verifyMut.mutate(k.id); }} disabled={verifyMut.isPending} className="shadow-sm">Verifikasi</Button>
                          <div className="flex gap-1">
                            <Input placeholder="Alasan tolak" value={rejectNote[k.id] || ""} onChange={(e) => setRejectNote((s) => ({ ...s, [k.id]: e.target.value }))} className="h-8 w-28 text-xs" />
                            <Button variant="outline" size="sm" onClick={() => { const n = rejectNote[k.id]?.trim(); if (!n) return toast.error("Isi alasan penolakan"); if (!confirm(`Tolak kost "${k.name}"?`)) return; rejectMut.mutate({ id: k.id, note: n }); }}>Tolak</Button>
                          </div>
                        </>
                      )}
                      <Button variant="outline" size="sm" onClick={() => setEditing({ id: k.id, name: k.name, city: k.city })}>Edit</Button>
                      <Button variant="outline" size="sm" onClick={() => { if (!confirm(`Hapus kost "${k.name}"? Semua kamar & booking ikut terhapus!`)) return; deleteMut.mutate(k.id); }} className="text-red-600 hover:bg-red-50">Hapus</Button>
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
            <h3 className="font-semibold">Edit Kost</h3>
            <Input label="Nama" value={editing.name} onChange={(e) => setEditing((s) => s && { ...s, name: e.target.value })} />
            <Input label="Kota" value={editing.city} onChange={(e) => setEditing((s) => s && { ...s, city: e.target.value })} />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditing(null)}>Batal</Button>
              <Button className="flex-1" disabled={updateMut.isPending} onClick={() => { if (!confirm("Simpan perubahan kost?")) return; updateMut.mutate(); }}>Simpan</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
