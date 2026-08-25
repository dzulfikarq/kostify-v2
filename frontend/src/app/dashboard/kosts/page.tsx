"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { dashboardApi } from "@/services/api/dashboard";
import { useMe } from "@/hooks/useAuth";
import { Card, Skeleton } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function KostsContent() {
  const { data: user } = useMe();
  const sp = useSearchParams();
  const router = useRouter();
  const page = Number(sp.get("page") || "1");
  const search = sp.get("search") || "";
  const status = sp.get("status") || "";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["owner-kosts", page, search, status],
    queryFn: () => dashboardApi.listOwnerKosts({ page, limit: 12, search: search || undefined, status: status || undefined }),
    enabled: !!user,
  });

  if (!user) return <div className="p-6 text-sm">Memuat...</div>;
  if (user.role !== "owner" && user.role !== "super_admin") return <div className="p-6">Hanya owner</div>;

  return (
    <div className="space-y-4 p-2 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Kost Saya</h1>
        <Link href="/dashboard/kosts/new"><Button>Tambah Kost</Button></Link>
      </div>

      <div className="flex gap-2">
        {["", "pending", "verified", "rejected"].map((s) => (
          <button key={s} onClick={() => router.push(`/dashboard/kosts?status=${s}&page=1`)} className={`rounded-full border px-3 py-1 text-sm ${status===s?"bg-zinc-900 text-white border-zinc-900":"bg-white"}`}>{s||"Semua"}</button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-32" /><Skeleton className="h-32" /></div>
      ) : isError ? (
        <Card className="text-sm text-red-600">Gagal memuat</Card>
      ) : !data?.items.length ? (
        <EmptyState title="Belum ada kost" description="Buat kost pertama, tunggu verifikasi admin." action={<Link href="/dashboard/kosts/new"><Button>Buat Kost</Button></Link>} />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {data.items.map((k: any) => (
              <Card key={k.id} className="flex flex-col">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold">{k.name}</h3>
                  <Badge tone={k.status==="verified"?"green":k.status==="pending"?"amber":"red"}>{k.status}</Badge>
                </div>
                <p className="text-sm text-zinc-500">{k.city} • {k.gender}</p>
                <p className="mt-2 line-clamp-2 text-xs text-zinc-600">{k.description || "-"}</p>
                <div className="mt-4 flex gap-2">
                  <Link href={`/dashboard/kosts/${k.id}`} className="flex-1"><Button variant="outline" size="sm" className="w-full">Kelola</Button></Link>
                  <Link href={`/kosts/${k.id}`} target="_blank"><Button variant="ghost" size="sm">Lihat Publik</Button></Link>
                </div>
              </Card>
            ))}
          </div>
          <div className="flex justify-center gap-2 pt-4">
            <Button variant="outline" size="sm" disabled={page<=1} onClick={()=>router.push(`/dashboard/kosts?page=${page-1}&status=${status}`)}>Prev</Button>
            <span className="py-1 text-sm">{page} / {data.pagination.total_pages}</span>
            <Button variant="outline" size="sm" disabled={page>=data.pagination.total_pages} onClick={()=>router.push(`/dashboard/kosts?page=${page+1}&status=${status}`)}>Next</Button>
          </div>
        </>
      )}
    </div>
  );
}

export default function Page(){ return <Suspense fallback={<div className="p-6">Memuat...</div>}><KostsContent/></Suspense> }
