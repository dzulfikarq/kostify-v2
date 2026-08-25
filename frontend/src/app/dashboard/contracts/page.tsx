"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardApi } from "@/services/api/dashboard";
import { Card, Skeleton } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
import { TableRoot, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/tailgrids/core/table";
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
    onError: (e: any) => toast.error(e.response?.data?.error?.message || "Gagal mengakhiri"),
  });

  return (
    <div className="space-y-5 p-2 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kontrak</h1>
        <p className="text-sm text-zinc-500">Sewa aktif — akhiri lebih awal jika penyewa keluar</p>
      </div>

      {isLoading ? (
        <Card className="p-0 overflow-hidden"><Skeleton className="h-64" /></Card>
      ) : !data?.items.length ? (
        <EmptyState title="Belum ada kontrak" description="Kontrak dibuat otomatis saat booking disetujui." />
      ) : (
        <Card className="p-0 overflow-hidden border-0 shadow-sm">
          <TableRoot>
            <TableHeader>
              <TableRow className="bg-zinc-50/50">
                <TableHead>Kamar</TableHead>
                <TableHead>Penyewa</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((c: any) => (
                <TableRow key={c.id} className="hover:bg-[#f5f0ff]/40">
                  <TableCell>
                    <span className="inline-flex h-8 w-10 items-center justify-center rounded-lg bg-zinc-900 text-xs font-mono font-bold text-white">{c.room?.room_number || "?"}</span>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{c.tenant?.name || c.tenant_id.slice(0, 8)}</p>
                    <p className="text-xs text-zinc-500">{c.tenant?.email || ""}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{c.start_date} → {c.end_date}</p>
                    <p className="text-xs text-zinc-500">{c.status === "active" ? "Berjalan" : "Selesai"}</p>
                  </TableCell>
                  <TableCell><Badge tone={c.status === "active" ? "green" : "zinc"}>{c.status}</Badge></TableCell>
                  <TableCell>
                    {c.status === "active" ? (
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (!confirm(`Akhiri kontrak kamar ${c.room?.room_number} lebih awal?`)) return;
                            endMut.mutate(c.id);
                          }}
                          disabled={endMut.isPending}
                        >
                          Akhiri
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
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
