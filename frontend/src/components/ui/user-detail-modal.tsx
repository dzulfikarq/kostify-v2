"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from '@/utils/date';
import { useLang } from '@/i18n';

export function UserDetailModal({
  user,
  onClose,
}: {
  user: { id: string; name: string; email: string; phone?: string; role: string; is_active: boolean; created_at: string } | null;
  onClose: () => void;
}) {
  const { t } = useLang();
  if (!user) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <Card className="w-full max-w-sm space-y-4 border-0 shadow-xl" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#8550e6] to-[#4f46e5] text-lg font-bold text-white">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold">{user.name}</p>
            <p className="text-xs text-zinc-500">{user.email}</p>
          </div>
          <Badge tone={user.role === "owner" ? "blue" : user.role === "super_admin" ? "amber" : "zinc"} className="ml-auto">
            {user.role}
          </Badge>
        </div>
        <div className="grid gap-2 border-t pt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500">{t("ud.telepon")}</span>
            <span>{user.phone || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">{t("ud.status")}</span>
            <span>{user.is_active ? "Aktif" : "Nonaktif"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">{t("pf.bergabung")}</span>
            <span>{formatDateTime(user.created_at)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">{t("ud.id")}</span>
            <span className="font-mono text-xs">{user.id.slice(0, 8)}</span>
          </div>
        </div>
        <Button variant="outline" className="w-full" onClick={onClose}>{t("c.tutup")}</Button>
      </Card>
    </div>
  );
}
