"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { kostsApi } from "@/services/api/kosts";
import { bookingsApi } from "@/services/api/bookings";
import { useMe } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import Link from "next/link";
import {
  MapMarker5,
  Buildings11,
  User2,
} from "@tailgrids/icons";
import { useLang } from "@/i18n";

const rupiah = (n: number) => `Rp ${Number(n).toLocaleString("id-ID")}`;

export default function KostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { data: user } = useMe();
  const { t } = useLang();
  const [bookRoom, setBookRoom] = useState<null | {
    id: string;
    room_number: string;
    price: number;
  }>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["kost", id],
    queryFn: () => kostsApi.getPublic(id),
    enabled: !!id,
  });

  const bookMut = useMutation({
    mutationFn: (room_id: string) => bookingsApi.create(room_id),
    onSuccess: () => {
      toast.success("Booking berhasil — ter-reserve 3 hari, menunggu konfirmasi pemilik");
      qc.invalidateQueries({ queryKey: ["kost", id] });
    },
  });

  if (isLoading) {
    return (
      <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
        <Skeleton className="h-72" />
        <Skeleton className="mt-4 h-32" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="container section" style={{ textAlign: "center" }}>
        <div
          style={{
            width: 64,
            height: 64,
            margin: "0 auto 16px",
            borderRadius: 18,
            background: "rgba(133, 80, 230, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-amber)",
          }}
        >
          <Buildings11 size={30} />
        </div>
        <p style={{ color: "var(--color-muted)", marginBottom: 16 }}>{t("kd.belum_ada")}</p>
        <Link href="/kosts" className="btn-outline btn-outline--sm">
          {t("kd.kembali_daftar")}
        </Link>
      </div>
    );
  }

  const kost = data.kost;
  const rooms = data.rooms || [];

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 64 }}>
      <Link href="/kosts" className="btn-ghost" style={{ paddingLeft: 0 }}>
        ← {t("kd.kembali_daftar")}
      </Link>

      {/* Galeri + Info */}
      <div className="detail-grid" style={{ marginTop: 16 }}>
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
              {kost.photos?.[0] ? (
                <img
                  src={kost.photos[0]}
                  alt={kost.name}
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
            {kost.photos?.length > 1 && (
              <div className="grid-4" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 12 }}>
                {kost.photos.slice(1, 5).map((p, i) => (
                  <img
                    key={i}
                    src={p}
                    alt=""
                    style={{
                      aspectRatio: "1/1",
                      width: "100%",
                      objectFit: "cover",
                      borderRadius: "var(--radius-md)",
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Info — satu card */}
          <div className="card card--static" style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
              <h1 style={{ margin: 0 }}>{kost.name}</h1>
              <span className="tag" style={{ flexShrink: 0 }}>
                {kost.gender}
              </span>
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
              {kost.city}
              {kost.address ? ` · ${kost.address}` : ""}
            </p>

            {kost.status === "verified" && (
              <div style={{ marginTop: 12 }}>
                <span className="badge-verified">✓ Terverifikasi Admin</span>
              </div>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginTop: 16,
                paddingTop: 16,
                borderTop: "1px solid var(--color-paper-2)",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "rgba(133, 80, 230, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--color-amber)",
                  flexShrink: 0,
                }}
              >
                <User2 size={20} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--color-muted)" }}>{t("kd.pemilik")}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>
                  {kost.owner?.name || "-"}
                </div>
              </div>
            </div>

            {kost.description ? (
              <p
                style={{
                  marginTop: 16,
                  marginBottom: 0,
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: "var(--color-text)",
                }}
              >
                {kost.description}
              </p>
            ) : null}

            {kost.facilities?.length ? (
              <>
                <h3 style={{ fontSize: "0.95rem", marginBottom: 10, marginTop: 20 }}>
                  {t("kd.fasilitas")}
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {kost.facilities.map((f) => (
                    <span
                      key={f}
                      className="chip"
                      style={{ cursor: "default", padding: "5px 12px", fontSize: 13 }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </>
            ) : null}
          </div>
      </div>

      {/* Rooms */}
      <section style={{ marginTop: 48 }}>
        <div className="listing-head">
          <h2>
            {t("kd.kamar")} ({rooms.length})
          </h2>
        </div>

        {!rooms.length ? (
          <div className="card" style={{ textAlign: "center", padding: "40px 24px", color: "var(--color-muted)" }}>
            {t("kd.belum_ada_kamar")}
          </div>
        ) : (
          <div className="grid-3">
            {rooms.map((rm) => {
              const canBook = rm.status === "available";
              const statusLabel =
                rm.status === "available"
                  ? t("kd.booking_sekarang")
                  : rm.status === "reserved"
                    ? "Terpesan"
                    : rm.status === "occupied"
                      ? "Terisi"
                      : "Maintenance";
              return (
                <div key={rm.id} className="card card--static" style={{ display: "flex", flexDirection: "column" }}>
                  <Link href={`/kosts/${kost.id}/kamar/${rm.id}`} style={{ display: "block", overflow: "hidden" }}>
                    <div style={{ aspectRatio: "16/10", background: "var(--color-paper-2)" }}>
                      {rm.photos?.[0] ? (
                        <img
                          src={rm.photos[0]}
                          alt={rm.room_number}
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
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
                          <Buildings11 size={36} />
                        </div>
                      )}
                    </div>
                  </Link>

                  <div
                    style={{
                      padding: 18,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      flex: 1,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontWeight: 700, color: "var(--color-ink-2)" }}>Kamar {rm.room_number}</span>
                      <span
                        className={`tag ${rm.status === "available" ? "" : "tag--outline"}`}
                        style={{ fontSize: 11, padding: "4px 10px" }}
                      >
                        {rm.status}
                      </span>
                    </div>

                    <div>
                      <span style={{ fontSize: 17, fontWeight: 700, color: "var(--color-amber)" }}>
                        {rupiah(rm.price_monthly)}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--color-muted)" }}> /bulan</span>
                    </div>

                    {rm.luas ? (
                      <p style={{ margin: 0, fontSize: 13, color: "var(--color-muted)" }}>
                        Luas {Number(rm.luas)} m²
                      </p>
                    ) : null}

                    {rm.facilities?.length ? (
                      <p
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          margin: 0,
                          fontSize: 12,
                          color: "var(--color-muted)",
                        }}
                      >
                        {rm.facilities.join(" · ")}
                      </p>
                    ) : null}

                    <div className="room-actions" style={{ paddingTop: 12, borderTop: "1px solid var(--color-paper-2)" }}>
                      <Link href={`/kosts/${kost.id}/kamar/${rm.id}`} className="btn-outline">
                        {t("c.detail")}
                      </Link>
                      <Button
                        className={`btn-primary ${canBook ? "" : "btn-primary--disabled"}`}
                        style={{ opacity: canBook ? 1 : 0.55, cursor: canBook ? "pointer" : "not-allowed" }}
                        disabled={!canBook || bookMut.isPending}
                        onClick={() => {
                          if (!user) {
                            toast.error(t("kd.login_dulu"));
                            router.push(`/login?next=/kosts/${kost.id}`);
                            return;
                          }
                          if (user.role !== "tenant") {
                            toast.error(t("kd.hanya_tenant"));
                            return;
                          }
                          setBookRoom({ id: rm.id, room_number: rm.room_number, price: Number(rm.price_monthly) });
                        }}
                      >
                        {statusLabel}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {bookRoom && (
        <ConfirmDialog
          open
          title={t("kd.cd_booking", { room: bookRoom.room_number })}
          description={t("kd.cd_booking_desc", { price: bookRoom.price.toLocaleString("id-ID") })}
          tone="violet"
          confirmText={t("kd.booking_sekarang")}
          onConfirm={() => {
            bookMut.mutate(bookRoom.id);
            setBookRoom(null);
          }}
          onCancel={() => setBookRoom(null)}
        />
      )}
    </div>
  );
}
