"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Home,
  Search1,
  MapMarker5,
  StarIcon,
  Buildings11,
  HandShake,
} from "@tailgrids/icons";
import { kostsApi } from "@/services/api/kosts";
import { KostCard } from "@/components/kost/KostCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useLang } from "@/i18n";

export default function LandingPage() {
  const router = useRouter();
  const { t } = useLang();
  const [q, setQ] = useState("");
  const [activeChip, setActiveChip] = useState("semua");

  const { data, isLoading } = useQuery({
    queryKey: ["kosts", "featured"],
    queryFn: () => kostsApi.listPublic({ limit: 6 }),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) {
      router.push(`/kosts?search=${encodeURIComponent(q)}`);
    }
  };

  const chips = [
    { id: "semua", label: t("c.semua"), value: "" },
    { id: "putri", label: "Putri", value: "putri" },
    { id: "putra", label: "Putra", value: "putra" },
    { id: "campur", label: t("ph.kategori.campur"), value: "campur" },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <div className="hero-inner">
            <span className="tag tag--light hero-badge">
              <Home size={14} style={{ marginRight: 6 }} />
              {t("ph.badge_hero")}
            </span>
            <h1>
              {t("ph.hero_judul_1")}
              <br />
              <span className="hero-accent">{t("ph.hero_judul_2")}</span>
            </h1>
            <p className="hero-desc">{t("ph.hero_desc")}</p>

            <form
              onSubmit={handleSearch}
              className="search-card search-card--hero"
            >
              <div className="hero-search">
                <div className="hero-search-field">
                  <Search1
                    size={18}
                    style={{
                      position: "absolute",
                      left: 16,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--color-muted)",
                    }}
                  />
                  <input
                    id="hero-search"
                    type="search"
                    aria-label="Cari kost"
                    className="search-input"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={t("ph.search_placeholder")}
                  />
                </div>
                <Button type="submit" className="btn-primary">
                  {t("ph.cari")}
                </Button>
              </div>
            </form>

            <div className="hero-chips">
              {chips.map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => {
                    setActiveChip(chip.id);
                    const params = new URLSearchParams();
                    if (chip.value) params.set("gender", chip.value);
                    router.push(`/kosts?${params.toString()}`);
                  }}
                  className={`chip ${activeChip === chip.id ? "chip--active" : ""}`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="container hero-stats-row">
          <div className="stats-pill">
            <span>
              <Buildings11
                size={16}
                style={{
                  verticalAlign: "-3px",
                  marginRight: 6,
                  color: "var(--color-amber-light)",
                }}
              />
              <strong>{t("ph.stat_kost")}</strong> kost terverifikasi
            </span>
            <span>
              <MapMarker5
                size={16}
                style={{
                  verticalAlign: "-3px",
                  marginRight: 6,
                  color: "var(--color-amber-light)",
                }}
              />
              <strong>{t("ph.stat_kota")}</strong> kota
            </span>
            <span>
              <StarIcon
                size={16}
                style={{
                  verticalAlign: "-3px",
                  marginRight: 6,
                  color: "var(--color-amber-light)",
                }}
              />
              <strong>{t("ph.stat_rating")}</strong> rating
            </span>
          </div>
        </div>
      </section>

      {/* Kategori */}
      <section
        className="section"
        style={{ background: "var(--color-paper)", paddingBottom: 48 }}
      >
        <div className="container">
          <div className="section-head">
            <h2>{t("ph.kategori")}</h2>
            <p>{t("ph.kategori_desc")}</p>
          </div>

          <div className="grid-4">
            {[
              {
                key: "putri",
                icon: <Buildings11 size={28} />,
                href: "/kosts?gender=putri",
              },
              {
                key: "putra",
                icon: <Home size={28} />,
                href: "/kosts?gender=putra",
              },
              {
                key: "campur",
                icon: <HandShake size={28} />,
                href: "/kosts?gender=campur",
              },
              {
                key: "exklusif",
                icon: <StarIcon size={28} />,
                href: "/kosts?premium=true",
              },
            ].map((cat) => (
              <Link key={cat.key} href={cat.href} className="card cat-card">
                <div
                  className="cat-icon"
                  style={{
                    color: "var(--color-amber)",
                    background: "rgba(133, 80, 230, 0.1)",
                  }}
                >
                  {cat.icon}
                </div>
                <h3 className="cat-title">{t(`ph.kategori.${cat.key}`)}</h3>
                <p className="cat-desc">{t(`ph.kategori.${cat.key}_sub`)}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured/Listing */}
      <section
        className="section"
        style={{ background: "var(--color-paper)", paddingTop: 32 }}
      >
        <div className="container">
          <div className="listing-head">
            <h2>{t("ph.kost_terbaru")}</h2>
            <Link href="/kosts" className="btn-outline btn-outline--sm">
              {t("ph.lihat_semua")} →
            </Link>
          </div>

          {isLoading ? (
            <div className="grid-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card">
                  <div
                    style={{ height: 200, background: "var(--color-paper-2)" }}
                  />
                  <div style={{ padding: 20 }}>
                    <div
                      className="skeleton-line"
                      style={{ height: 24, width: "60%" }}
                    />
                    <div className="skeleton-line" style={{ width: "80%" }} />
                    <div
                      className="skeleton-line"
                      style={{ width: "50%", marginBottom: 0 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : data?.items.length ? (
            <div className="grid-3">
              {data.items.map((k) => (
                <KostCard key={k.id} kost={k} />
              ))}
            </div>
          ) : (
            <div
              className="card"
              style={{ textAlign: "center", padding: "48px 40px" }}
            >
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
              <h3 style={{ marginBottom: 8 }}>{t("ph.belum_ada_kost")}</h3>
              <p style={{ color: "var(--color-muted)", marginBottom: 24 }}>
                {t("ph.jadilah_pertama")}
              </p>
              <Link href="/register?role=owner">
                <Button className="btn-primary">{t("ph.daftar_kost")}</Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA Banner */}
      <section aria-labelledby="cta-heading">
        <div className="container">
          <div className="cta-banner reveal">
            <h2 id="cta-heading" className="cta-title">
              {t("ph.cta_title")}
            </h2>
            <p className="cta-desc">{t("ph.cta_desc")}</p>
            <Link href="/register?role=owner">
              <Button
                className="btn-primary"
                style={{
                  background: "var(--color-amber-light)",
                  color: "var(--color-ink)",
                }}
              >
                {t("ph.daftar_sekarang")}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
