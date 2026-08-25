"use client";

import { useMe } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/hooks/useAuth";

export default function ProfilePage() {
  const { data: user, isLoading } = useMe();
  const logout = useLogout();

  if (isLoading) return <div className="p-6 text-sm text-zinc-500">Memuat...</div>;
  if (!user) return <div className="p-6 text-sm">Silakan login</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-2 lg:p-6">
      <h1 className="text-xl font-bold">My Profile</h1>
      <Card className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-white text-lg font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold">{user.name}</p>
            <p className="text-sm text-zinc-500">{user.email}</p>
          </div>
          <Badge tone={user.role === "owner" ? "blue" : user.role === "super_admin" ? "amber" : "zinc"} className="ml-auto">
            {user.role}
          </Badge>
        </div>
        <div className="grid gap-2 text-sm">
          <div className="flex justify-between border-t pt-3">
            <span className="text-zinc-500">Phone</span>
            <span>{user.phone || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Status</span>
            <span>{user.is_active ? "Aktif" : "Nonaktif"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Bergabung</span>
            <span>{new Date(user.created_at).toLocaleDateString("id-ID")}</span>
          </div>
        </div>
        <Button variant="outline" className="w-full" onClick={() => logout.mutate()} disabled={logout.isPending}>
          {logout.isPending ? "Logging out..." : "Logout"}
        </Button>
      </Card>
    </div>
  );
}
