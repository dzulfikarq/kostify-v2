"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useLang } from "@/i18n";
import { useMe } from "@/hooks/useAuth";
import { kostsApi } from "@/services/api/kosts";
import { bookingsApi } from "@/services/api/bookings";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatDateTime } from "@/utils/date";
import { toast } from "sonner";
import Link from "next/link";
import {
  Buildings11,
  MapMarker5,
  User2,
} from "@tailgrids/icons";

const rupiah = (n: number) => `Rp ${Number(n).toLocaleString("id-ID")}`;

export default function RoomDetailPage() {
  const { id, roomId } = useParams<{ id: string; roomId: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { data: user } = useMe();
  const [bookNow, setBookNow] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const { t } = useLang();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["kost", id],
    queryFn: () => kostsApi.getPublic(id),
    enabled: !!id,
  });

  const bookMut = useMutation({
    mutationFn: (room_id: string) => bookingsApi.create(room_id),
    onSuccess: () => {
      toast.success(t("kd.booking_sukses"));
      qc.invalidateQueries({ queryKey: ["kost", id] });
    },
  });

  if (isLoading) {
    return (
      <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
        <Skeleton className="h-80" />
        <Skeleton className="mt-4 h-32" />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="container section" style={{ textAlign: "center" }}>
        <p style={{ color: "var(--color-muted)", marginBottom: 16 }}>{t("kd.belum_ada")}</p>
        <Link href="/kosts" className="btn-outline btn-outline--sm">
          {t("kd.kembali_daftar")}
        </Link>
      </div>
    );
  }

  const kost = data.kost;
  const room = (data.rooms || []).find((r) => r.id === roomId);

  if (!room) {
    return (
      <div className="container section" style={{ textAlign: "center" }}>
        <p style={{ color: "var(--color-muted)", marginBottom: 16 }}>Kamar tidak ditemukan</p>
        <Link href={`/kosts/${kost.id}`} className="btn-outline btn-outline--sm">
          ← {kost.name}
        </Link>
      </div>
    );
  }

  const canBook = room.status === "available";
  const statusText = canBook
    ? "Tersedia"
    : room.status === "reserved"
      ? "Dipesan"
      : room.status === "occupied"
        ? "Terisi"
        : "Maintenance";

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 64 }}>
      <Link href={`/kosts/${kost.id}`} className="btn-ghost" style={{ paddingLeft: 0 }}>
        ← {kost.name}
      </Link>

      <div className="detail-grid" style={{ marginTop: 16 }}>
        {/* Galeri foto */}
        <div>
          <div
            style={{
              aspectRatio: "16/10",
              overflow: "hidden",
              borderRadius: "var(--radius-lg)",
              background: "var(--color-paper-2)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            {room.photos?.[activePhoto] ? (
              <img
                src={room.photos[activePhoto]}
                alt={room.room_number}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--color-muted)",
                }}
              >
                <Buildings11 size={56} />
              </div>
            )}
          </div>

          {room.photos?.length > 1 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              {room.photos.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setActivePhoto(i)}
                  style={{
                    width: 72,
                    padding: 0,
                    overflow: "hidden",
                    borderRadius: "var(--radius-md)",
                    border: `2px solid ${i === activePhoto ? "var(--color-amber)" : "transparent"}`,
                    opacity: i === activePhoto ? 1 : 0.7,
                    cursor: "pointer",
                    background: "none",
                  }}
                >
                  <img src={p} alt="" style={{ aspectRatio: "1/1", width: "100%", objectFit: "cover", display: "block" }} />
                </button>
              ))}
            </div>
          )}

          {/* Kontak pemilik */}
          <div className="card" style={{ padding: 20, display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "rgba(133, 80, 230, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-amber)",
                flexShrink: 0,
              }}
            >
                <User2 size={22} />
            </div>
            <div>
              <div style={{ fontSize: 13, color: "var(--color-muted)" }}>{t("kd.kontak")}</div>
              <div style={{ fontWeight: 600, color: "var(--color-text)" }}>
                {kost.owner?.name || t("kd.pemilik")}
              </div>
              {kost.owner?.email ? (
                <div style={{ fontSize: 13, color: "var(--color-muted)" }}>{kost.owner.email}</div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Info kamar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h1 style={{ margin: 0 }}>Kamar {room.room_number}</h1>
              <span className={`tag ${canBook ? "" : "tag--outline"}`}>{statusText}</span>
            </div>

            <div style={{ marginTop: 12 }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: "var(--color-amber)" }}>
                {rupiah(room.price_monthly)}
              </span>
              <span style={{ fontSize: 14, color: "var(--color-muted)" }}> /bulan</span>
            </div>

            <p
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginTop: 10,
                marginBottom: 0,
                fontSize: 14,
                color: "var(--color-muted)",
              }}
            >
              <MapMarker5 size={16} />
              {kost.name} ·{" "}
              {[kost.village, kost.district, kost.regency].filter(Boolean).join(", ") || kost.city}
            </p>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: "1rem", marginBottom: 12 }}>Info Kamar</h3>
            <div style={{ display: "grid", gap: 10, fontSize: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-muted)" }}>Luas</span>
                <span>{room.luas ? `${Number(room.luas)} m²` : "-"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-muted)" }}>Status</span>
                <span>{statusText}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-muted)" }}>Terdaftar Sejak</span>
                <span>{formatDateTime(room.created_at)}</span>
              </div>
            </div>
          </div>

          {room.facilities?.length ? (
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: "1rem", marginBottom: 12 }}>{t("kd.fasilitas")}</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {room.facilities.map((f) => (
                  <span key={f} className="chip" style={{ cursor: "default", padding: "5px 12px", fontSize: 13 }}>
                    {f}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <Button
            className="btn-primary"
            style={{ width: "100%", opacity: canBook ? 1 : 0.45 }}
            disabled={!canBook || bookMut.isPending}
            onClick={() => {
              if (!user) {
                toast.error(t("kd.login_dulu"));
                router.push(`/login?next=/kosts/${kost.id}/kamar/${room.id}`);
                return;
              }
              if (user.role !== "tenant") {
                toast.error(t("kd.hanya_tenant"));
                return;
              }
              setBookNow(true);
            }}
          >
            {!canBook
              ? room.status === "reserved"
                ? "Sudah Dipesan"
                : room.status === "occupied"
                  ? "Sudah Terisi"
                  : "Sedang Perbaikan"
              : bookMut.isPending
                ? t("new.mengajukan")
                : t("kd.booking_sekarang")}
          </Button>
          <p style={{ textAlign: "center", fontSize: 13, color: "var(--color-muted)", margin: 0 }}>
            Reservasi berlaku 3 hari menunggu jawaban pemilik
          </p>
        </div>
      </div>

      {bookNow && (
        <ConfirmDialog
          open
          title={t("kd.cd_booking", { room: room.room_number })}
          description={t("kd.cd_booking_desc", { price: Number(room.price_monthly).toLocaleString("id-ID") })}
          tone="violet"
          confirmText={t("kd.booking_sekarang")}
          onConfirm={() => {
            bookMut.mutate(room.id);
            setBookNow(false);
          }}
          onCancel={() => setBookNow(false)}
        />
      )}
    </div>
  );
}
