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
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["admin-kosts", "pending"],
    queryFn: () => dashboardApi.listAdminKosts({ status: "pending", limit: 20 }),
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

  if (user && user.role !== "super_admin") return <div className="p-6 text-sm">Hanya super admin</div>;

  return (
    <div className="space-y-5 p-2 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Verifikasi Kost</h1>
        <p className="text-sm text-zinc-500">Review kost pending — pastikan foto, alamat, dan data pemilik valid</p>
      </div>

      {isLoading ? (
        <Card className="p-0 overflow-hidden"><Skeleton className="h-64" /></Card>
      ) : !data?.items.length ? (
        <EmptyState title="Tidak ada antrian" description="Semua kost sudah diverifikasi. Kost baru akan muncul di sini." />
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
                  <TableCell><Badge tone="amber">{k.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1.5">
                      <Button size="sm" onClick={() => verifyMut.mutate(k.id)} disabled={verifyMut.isPending} className="shadow-sm">Verifikasi</Button>
                      <div className="flex gap-1">
                        <Input placeholder="Alasan tolak" value={rejectNote[k.id] || ""} onChange={(e) => setRejectNote((s) => ({ ...s, [k.id]: e.target.value }))} className="h-8 w-28 text-xs" />
                        <Button variant="outline" size="sm" onClick={() => { const n = rejectNote[k.id]?.trim(); if (!n) return toast.error("Isi alasan penolakan"); rejectMut.mutate({ id: k.id, note: n }); }}>Tolak</Button>
                      </div>
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
