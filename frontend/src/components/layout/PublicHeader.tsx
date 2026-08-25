"use client";

import Link from "next/link";
import { useState } from "react";
import { useMe, useLogout } from "@/hooks/useAuth";
import { useLang, LangToggle } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home } from "@tailgrids/icons";

export function PublicHeader() {
  const { data: user } = useMe();
  const logout = useLogout();
  const { t } = useLang();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="header">
        <div className="container header-inner">
          <Link href="/" className="header-logo" aria-label="Kostify - Beranda">
            <span className="header-logo-icon">
              <Home size={18} />
            </span>
            <span>Kostify</span>
          </Link>

          <nav className="header-nav" aria-label="Navigasi utama">
            <Link href="/kosts">{t("ph.cari")}</Link>
            {user && <Link href="/my-bookings">{t("ph.booking_saya")}</Link>}
            {user && (user.role === "owner" || user.role === "super_admin") && (
              <Link href="/dashboard">{t("ph.dashboard")}</Link>
            )}
          </nav>

          <div className="header-actions">
            <LangToggle />
            {!user ? (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="btn-ghost">
                    {t("ph.masuk")}
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="btn-primary">
                    {t("ph.daftar")}
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <span className="hidden text-sm text-zinc-600 sm:block">{user.name}</span>
                <Badge tone={user.role === "owner" ? "blue" : user.role === "super_admin" ? "amber" : "zinc"}>{user.role}</Badge>
                <Button variant="ghost" size="sm" onClick={() => logout.mutate()} disabled={logout.isPending} className="btn-ghost">
                  {t("ph.keluar")}
                </Button>
              </>
            )}
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu"}
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </header>

      <div id="mobile-menu" className={`mobile-menu ${mobileMenuOpen ? "open" : ""}`} role="dialog" aria-label="Menu mobile">
        <nav>
          <Link href="/kosts" onClick={() => setMobileMenuOpen(false)}>{t("ph.cari")}</Link>
          {user && <Link href="/my-bookings" onClick={() => setMobileMenuOpen(false)}>{t("ph.booking_saya")}</Link>}
          {user && (user.role === "owner" || user.role === "super_admin") && (
            <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>{t("ph.dashboard")}</Link>
          )}
        </nav>
        <div className="mobile-menu-actions">
          <LangToggle />
          {!user ? (
            <>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="btn-ghost w-full">{t("ph.masuk")}</Button>
              </Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button className="btn-primary w-full">{t("ph.daftar")}</Button>
              </Link>
            </>
          ) : (
            <>
              <Button variant="ghost" className="btn-ghost w-full" onClick={() => logout.mutate()}>{t("ph.keluar")}</Button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export function PublicFooter() {
  const { t } = useLang();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <Link href="/" className="header-logo" aria-label="Kostify - Beranda">
            <span className="header-logo-icon">
              <Home size={18} />
            </span>
            <span>Kostify</span>
          </Link>

          <nav className="footer-nav" aria-label="Navigasi footer" style={{ display: "flex", gap: 24 }}>
            <Link href="/kosts">{t("ph.cari")}</Link>
            <Link href="/my-bookings">{t("ph.booking_saya")}</Link>
            <Link href="/register?role=owner">{t("ph.daftar_kost")}</Link>
          </nav>
        </div>

        <div className="footer-bottom">
          <p>© {currentYear} Kostify. Hak cipta dilindungi.</p>
        </div>
      </div>
    </footer>
  );
}
