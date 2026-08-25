import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Kost } from "@/services/api/types";
import { Card } from "@/components/ui/card";

export function KostCard({ kost }: { kost: Kost }) {
  const cover = kost.photos?.[0];
  return (
    <Link href={`/kosts/${kost.id}`} className="group block">
      <Card className="overflow-hidden p-0 transition hover:shadow-md">
        <div className="aspect-[4/3] overflow-hidden bg-zinc-100">
          {cover ? (
            <img src={cover} alt={kost.name} className="h-full w-full object-cover transition group-hover:scale-[1.02]" />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl">🏠</div>
          )}
        </div>
        <div className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 font-semibold text-zinc-900 group-hover:underline">{kost.name}</h3>
            <Badge tone={kost.gender === "putra" ? "blue" : kost.gender === "putri" ? "amber" : "zinc"}>{kost.gender}</Badge>
          </div>
          <p className="line-clamp-1 text-sm text-zinc-500">{kost.city} • {kost.address || "Alamat tersedia"}</p>
          {kost.facilities?.length ? (
            <p className="line-clamp-1 text-xs text-zinc-500">{kost.facilities.join(" • ")}</p>
          ) : null}
        </div>
      </Card>
    </Link>
  );
}
