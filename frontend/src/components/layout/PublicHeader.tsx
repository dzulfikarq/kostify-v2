"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMe, useLogout } from "@/hooks/useAuth";
import { useLang, LangToggle } from "@/i18n";
import { chatApi } from "@/services/api/extras";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, Comment1Dots, User2 } from "@tailgrids/icons";

function ChatBadge() {
  const { data } = useQuery({
    queryKey: ["chat-unread"],
    queryFn: () => chatApi.unread(),
    refetchInterval: 20000,
  });
  if (!data) return null;
  return (
    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
      {data > 9 ? "9+" : data}
    </span>
  );
}

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
            {user && user.role === "teknisi" && <Link href="/dashboard/teknisi">{t("ph.dashboard")}</Link>}
            {user && (user.role === "owner" || user.role === "super_admin") && (
              <Link href="/dashboard">{t("ph.dashboard")}</Link>
            )}
          </nav>

          <div className="header-actions">
            <LangToggle />
            {user && (
              <Link href="/chat" aria-label="Chat" style={{ textDecoration: "none" }}>
                <span className="relative flex h-10 w-10 items-center justify-center rounded-lg text-[#675F73] transition hover:bg-[#E9E2F2]">
                  <Comment1Dots size={20} />
                  <ChatBadge />
                </span>
              </Link>
            )}
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
                <Link href="/dashboard/profile" className="btn-ghost" style={{ textDecoration: "none" }}>
                  <User2 size={16} style={{ marginRight: 6 }} />
                  My Profile
                </Link>
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
          {user && user.role === "teknisi" && (
            <Link href="/dashboard/teknisi" onClick={() => setMobileMenuOpen(false)}>{t("ph.dashboard")}</Link>
          )}
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
