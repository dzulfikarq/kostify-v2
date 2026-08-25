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
import { Input } from "@/components/ui/input";
import { TableRoot, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/tailgrids/core/table";
import { useRouter, useSearchParams, redirect } from "next/navigation";
import { Suspense } from "react";
import { useLang } from "@/i18n";

function KostsContent() {
  const { data: user } = useMe();
  const { t } = useLang();
  const sp = useSearchParams();
  const router = useRouter();
  const page = Number(sp.get("page") || "1");
  const search = sp.get("search") || "";
  const status = sp.get("status") || "";
  const [localSearch, setLocalSearch] = useState(search);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["owner-kosts", page, search, status],
    queryFn: () => dashboardApi.listOwnerKosts({ page, limit: 10, search: search || undefined, status: status || undefined }),
    enabled: !!user,
  });

  function update(params: Record<string, string | undefined>) {
    const next = new URLSearchParams(sp.toString());
    Object.entries(params).forEach(([k, v]) => {
      if (!v) next.delete(k);
      else next.set(k, v);
    });
    if (!("page" in params)) next.set("page", "1");
    router.push(`/dashboard/kosts?${next.toString()}`);
  }

  if (!user) return <div className="p-6 text-sm text-zinc-500">Memuat...</div>;
  if (user.role !== "owner" && user.role !== "super_admin") redirect("/403");

  return (
    <div className="space-y-5 p-2 lg:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">{t("nav.kostsaya")}</h1>
          <p className="text-sm text-zinc-500">Kelola properti — {data?.pagination.total ?? 0} kost • {status || "semua status"}</p>
        </div>
        <Link href="/dashboard/kosts/new"><Button className="shadow-sm">{t("kost.tambah")}</Button></Link>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex flex-1 gap-2">
            <Input placeholder={t("kost.cari_ph")} value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && update({ search: localSearch || undefined })} className="flex-1" />
            <Button onClick={() => update({ search: localSearch || undefined })}>{t("c.cari")}</Button>
            {search && <Button variant="outline" onClick={() => { setLocalSearch(""); update({ search: undefined }); }}>{t("c.reset")}</Button>}
          </div>
          <div className="flex gap-1.5 overflow-x-auto">
            {[
              { label: t("c.semua"), value: "" },
              { label: t("status.pending"), value: "pending" },
              { label: t("status.verified"), value: "verified" },
              { label: t("status.rejected"), value: "rejected" },
            ].map((s) => (
              <button
                key={s.value}
                onClick={() => update({ status: s.value || undefined })}
                className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition ${status === s.value ? "bg-[#8550e6] text-white shadow-sm" : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {isLoading ? (
        <Card className="p-0 overflow-hidden"><Skeleton className="h-64" /></Card>
      ) : isError ? (
        <Card className="p-8 text-center text-sm text-red-600">Gagal memuat data</Card>
      ) : !data?.items.length ? (
        <EmptyState title="Belum ada kost" description="Buat kost pertama, tunggu verifikasi admin 1×24 jam." action={<Link href="/dashboard/kosts/new"><Button>{t("kost.buat")}</Button></Link>} />
      ) : (
        <Card className="p-0 overflow-hidden border-0 shadow-sm">
          <TableRoot>
            <TableHeader>
              <TableRow className="bg-zinc-50/50">
                <TableHead className="w-[36%]">{t("kost.kolom.kost")}</TableHead>
                <TableHead>{t("kost.kolom.kota")}</TableHead>
                <TableHead>{t("kost.kolom.gender")}</TableHead>
                <TableHead>{t("kost.kolom.status")}</TableHead>
                <TableHead className="text-right">{t("kost.kolom.aksi")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((k: any) => (
                <TableRow key={k.id} className="group hover:bg-[#f5f0ff]/50 transition">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#8550e6] to-[#4f46e5] text-white text-sm font-bold">
                        {k.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-zinc-900">{k.name}</p>
                        <p className="truncate text-xs text-zinc-500">{k.address || "-"}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><span className="text-sm">{k.city}</span></TableCell>
                  <TableCell><Badge tone={k.gender === "putra" ? "blue" : k.gender === "putri" ? "amber" : "zinc"}>{k.gender}</Badge></TableCell>
                  <TableCell><Badge tone={k.status === "verified" ? "green" : k.status === "pending" ? "amber" : "red"}>{k.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1.5">
                      <Link href={`/dashboard/kosts/${k.id}`}><Button variant="outline" size="sm">{t("kost.kelola")}</Button></Link>
                      <Link href={`/kosts/${k.id}`} target="_blank"><Button variant="ghost" size="sm">{t("c.lihat")}</Button></Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </TableRoot>

          <div className="flex items-center justify-between border-t bg-zinc-50/30 px-4 py-3">
            <p className="text-xs text-zinc-500">
              {t("c.hal")} {data.pagination.page} {t("c.dari")} {data.pagination.total_pages} • {data.pagination.total} kost
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => update({ page: String(page - 1) })}>{t("c.sebelumnya")}</Button>
              <Button variant="outline" size="sm" disabled={page >= data.pagination.total_pages} onClick={() => update({ page: String(page + 1) })}>{t("c.berikutnya")}</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-zinc-500">Memuat...</div>}>
      <KostsContent />
    </Suspense>
  );
}
