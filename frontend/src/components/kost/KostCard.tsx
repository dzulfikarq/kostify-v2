import Link from "next/link";
import { MapMarker5 } from "@tailgrids/icons";
import type { Kost } from "@/services/api/types";

export function KostCard({ kost }: { kost: Kost }) {
  const cover = kost.photos?.[0];

  return (
    <Link
      href={`/kosts/${kost.id}`}
      className="card group block"
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div style={{ position: "relative", overflow: "hidden" }}>
        {cover ? (
          <img
            src={cover}
            alt={kost.name}
            className="card__image"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              aspectRatio: "4/3",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--color-paper-2)",
              color: "var(--color-muted)",
            }}
          >
            <MapMarker5 size={40} />
          </div>
        )}
        {kost.status === "verified" && (
          <span className="badge-verified" style={{ position: "absolute", top: 12, right: 12 }}>
            ✓ Terverifikasi
          </span>
        )}
      </div>

      <div style={{ padding: "16px 18px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              color: "var(--color-ink-2)",
              margin: 0,
              lineHeight: 1.35,
            }}
          >
            {kost.name}
          </h3>
          <span className="tag tag--outline" style={{ flexShrink: 0, fontSize: 11, padding: "4px 10px" }}>
            {kost.gender}
          </span>
        </div>

        <p
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            margin: 0,
            fontSize: 13,
            color: "var(--color-muted)",
          }}
        >
          {kost.city}
          {kost.district ? ` · ${kost.district}` : ""}
        </p>

        {kost.facilities?.length ? (
          <p
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              margin: 0,
              fontSize: 12,
              color: "var(--color-muted)",
            }}
          >
            {kost.facilities.slice(0, 4).join(" · ")}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
