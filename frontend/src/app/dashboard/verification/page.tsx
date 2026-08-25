"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardApi } from "@/services/api/dashboard";
import { useMe } from "@/hooks/useAuth";
import { Card, Skeleton } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
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
    onSuccess: () => { toast.success("Kost diverifikasi"); qc.invalidateQueries({ queryKey: ["admin-kosts"] }); },
    onError: (e:any)=>toast.error(e.response?.data?.error?.message||"Gagal"),
  });
  const rejectMut = useMutation({
    mutationFn: ({id, note}:{id:string,note:string}) => dashboardApi.rejectKost(id, note),
    onSuccess: () => { toast.success("Kost ditolak"); qc.invalidateQueries({ queryKey: ["admin-kosts"] }); },
    onError: (e:any)=>toast.error(e.response?.data?.error?.message||"Gagal"),
  });

  if (user && user.role !== "super_admin") return <div className="p-6 text-sm">Hanya super admin</div>;

  return (
    <div className="space-y-4 p-2 lg:p-6">
      <h1 className="text-xl font-bold">Verifikasi Kost</h1>
      {isLoading ? <Skeleton className="h-32" /> : !data?.items.length ? <EmptyState title="Tidak ada antrian" description="Semua kost sudah diverifikasi."/> : (
        <div className="space-y-3">
          {data.items.map((k:any)=>(
            <Card key={k.id}>
              <div className="flex justify-between">
                <div>
                  <h3 className="font-semibold">{k.name} • {k.city}</h3>
                  <p className="text-sm text-zinc-500">{k.address}</p>
                  <p className="text-xs text-zinc-500">Owner: {k.owner?.email} • {k.gender}</p>
                </div>
                <Badge tone="amber">{k.status}</Badge>
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={()=>verifyMut.mutate(k.id)} disabled={verifyMut.isPending}>Verifikasi</Button>
                <input placeholder="Alasan tolak" value={rejectNote[k.id]||""} onChange={(e)=>setRejectNote(s=>({...s,[k.id]:e.target.value}))} className="flex-1 rounded-xl border px-3 py-1.5 text-sm" />
                <Button variant="outline" size="sm" onClick={()=>{ const n=rejectNote[k.id]?.trim(); if(!n) return toast.error("Isi alasan"); rejectMut.mutate({id:k.id,note:n})}}>Tolak</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
