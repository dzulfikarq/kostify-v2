"use client";

import Link from "next/link";
import { useMe, useLogout } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function PublicHeader() {
  const { data: user } = useMe();
  const logout = useLogout();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-white">⌖</span>
          <span className="text-lg font-bold tracking-tight">Kostify</span>
          <Badge tone="zinc" className="ml-1 hidden sm:inline-flex">Verified</Badge>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-zinc-600 md:flex">
          <Link href="/kosts" className="hover:text-zinc-900">Cari Kost</Link>
          {user && <Link href="/my-bookings" className="hover:text-zinc-900">Booking Saya</Link>}
          {user && (user.role === "owner" || user.role === "super_admin") && (
            <Link href="/dashboard" className="hover:text-zinc-900">Dashboard</Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {!user ? (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Masuk</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Daftar</Button>
              </Link>
            </>
          ) : (
            <>
              <span className="hidden text-sm text-zinc-600 sm:block">{user.name}</span>
              <Badge tone={user.role === "owner" ? "blue" : user.role === "super_admin" ? "amber" : "zinc"}>{user.role}</Badge>
              <Button variant="ghost" size="sm" onClick={() => logout.mutate()} disabled={logout.isPending}>
                Keluar
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-zinc-500">
        Kostify — platform kost terverifikasi. Booking tanpa DP online, survey dulu baru deal.
      </div>
    </footer>
  );
}
