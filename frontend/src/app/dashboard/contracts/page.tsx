"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardApi } from "@/services/api/dashboard";
import { Card, Skeleton } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
import { toast } from "sonner";

export default function ContractsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["owner-contracts"],
    queryFn: () => dashboardApi.listOwnerContracts({ limit: 20 }),
  });

  const endMut = useMutation({
    mutationFn: (id: string) => dashboardApi.endContract(id),
    onSuccess: () => {
      toast.success("Kontrak diakhiri, kamar tersedia kembali");
      qc.invalidateQueries({ queryKey: ["owner-contracts"] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || "Gagal"),
  });

  return (
    <div className="space-y-4 p-2 lg:p-6">
      <h1 className="text-xl font-bold">Kontrak Aktif</h1>
      {isLoading ? <Skeleton className="h-32" /> : !data?.items.length ? <EmptyState title="Belum ada kontrak" /> : (
        <div className="space-y-3">
          {data.items.map((c: any) => (
            <Card key={c.id} className="flex items-center justify-between">
              <div>
                <p className="font-mono text-sm">Kamar {c.room?.room_number} • {c.tenant?.name || c.tenant_id.slice(0,8)}</p>
                <p className="text-xs text-zinc-500">{c.start_date} → {c.end_date} • {c.status}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={c.status==="active"?"green":"zinc"}>{c.status}</Badge>
                {c.status==="active" && <Button variant="outline" size="sm" onClick={()=>{ if(confirm("Akhiri kontrak lebih awal?")) endMut.mutate(c.id)}}>Akhiri</Button>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
