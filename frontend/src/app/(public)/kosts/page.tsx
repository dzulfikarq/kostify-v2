"use client";

import { Suspense, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { kostsApi } from "@/services/api/kosts";
import { KostCard } from "@/components/kost/KostCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, Skeleton } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty";

function KostsContent() {
  const router = useRouter();
  const sp = useSearchParams();

  const page = Number(sp.get("page") || "1");
  const limit = Number(sp.get("limit") || "12");
  const search = sp.get("search") || "";
  const city = sp.get("city") || "";
  const gender = sp.get("gender") || "";
  const min_price = sp.get("min_price") || "";
  const max_price = sp.get("max_price") || "";
  const sort = sp.get("sort") || "created_at";
  const order = sp.get("order") || "desc";

  const [localSearch, setLocalSearch] = useState(search);
  const [localCity, setLocalCity] = useState(city);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["kosts", { page, limit, search, city, gender, min_price, max_price, sort, order }],
    queryFn: () =>
      kostsApi.listPublic({
        page,
        limit,
        search: search || undefined,
        city: city || undefined,
        gender: gender || undefined,
        min_price: min_price ? Number(min_price) : undefined,
        max_price: max_price ? Number(max_price) : undefined,
        sort,
        order,
      }),
  });

  function update(params: Record<string, string | undefined>) {
    const next = new URLSearchParams(sp.toString());
    Object.entries(params).forEach(([k, v]) => {
      if (!v) next.delete(k);
      else next.set(k, v);
    });
    if (!("page" in params)) next.set("page", "1");
    router.push(`/kosts?${next.toString()}`);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold">Cari Kost</h1>

      {/* Filters */}
      <Card className="mt-6">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <Input placeholder="Nama / alamat..." value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} />
          <Input placeholder="Kota (Jakarta, Bandung...)" value={localCity} onChange={(e) => setLocalCity(e.target.value)} />
          <Button
            onClick={() => update({ search: localSearch || undefined, city: localCity || undefined })}
            className="md:w-auto"
          >
            Terapkan
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { label: "Semua", value: "" },
            { label: "Campur", value: "campur" },
            { label: "Putra", value: "putra" },
            { label: "Putri", value: "putri" },
          ].map((g) => (
            <button
              key={g.value}
              onClick={() => update({ gender: g.value || undefined })}
              className={`chip ${gender === g.value ? "chip--active" : ""}`}
            >
              {g.label}
            </button>
          ))}
          <select
            value={`${sort}:${order}`}
            onChange={(e) => {
              const [s, o] = e.target.value.split(":");
              update({ sort: s, order: o });
            }}
            className="chip"
            style={{ appearance: "auto", cursor: "pointer" }}
          >
            <option value="created_at:desc">Terbaru</option>
            <option value="created_at:asc">Terlama</option>
            <option value="name:asc">Nama A–Z</option>
            <option value="name:desc">Nama Z–A</option>
          </select>
        </div>
      </Card>

      {/* Results */}
      <div className="mt-6">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : isError ? (
          <Card className="text-center">
            <p className="text-sm text-red-600">Gagal memuat data</p>
            <p className="text-xs text-zinc-500">{(error as Error).message}</p>
          </Card>
        ) : !data?.items.length ? (
          <EmptyState
            title="Tidak ada kost ditemukan"
            description="Coba ubah kata kunci atau filter."
            action={<Button onClick={() => router.push("/kosts")}>Reset filter</Button>}
          />
        ) : (
          <>
            <p className="mb-3 text-sm" style={{ color: "var(--color-muted)" }}>
              {data.pagination.total} kost ditemukan • Halaman {data.pagination.page} dari {data.pagination.total_pages}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.items.map((k) => (
                <KostCard key={k.id} kost={k} />
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => update({ page: String(page - 1) })}
              >
                Sebelumnya
              </Button>
              <span className="text-sm text-zinc-600">
                {page} / {data.pagination.total_pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.pagination.total_pages}
                onClick={() => update({ page: String(page + 1) })}
              >
                Berikutnya
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function KostsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-zinc-500">Memuat...</div>}>
      <KostsContent />
    </Suspense>
  );
}
