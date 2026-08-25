"use client";

import { BellIcon } from "@/components/common/header/icons";
import { Button } from "@/components/tailgrids/core/button";
import { OverlayWrapper } from "@/components/tailgrids/core/overlay";
import { Popover } from "@/components/tailgrids/core/popover";
import { ScrollArea, ScrollAreaViewport, ScrollBar } from "@/components/tailgrids/core/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardApi } from "@/services/api/dashboard";
import { useMe } from "@/hooks/useAuth";
import { timeAgo } from "@/utils/date";
import { cn } from "@/utils/cn";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { Header, Heading } from "react-aria-components";

export function NotificationsButton() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const router = useRouter();
  const qc = useQueryClient();
  const { data: me } = useMe();

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => dashboardApi.listNotifications(),
    enabled: !!me,
    refetchInterval: 30000,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => dashboardApi.markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const items = data?.items ?? [];
  const unreadCount = data?.unread ?? 0;

  return (
    <OverlayWrapper isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button
        iconOnly
        appearance="outline"
        className="relative size-10 rounded-lg border border-card-border bg-card-background text-icon-primary shadow-xs focus-visible:border-input-primary-focus-border focus-visible:ring-4 focus-visible:ring-input-primary-focus-border/20 [&>svg]:size-auto"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 z-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      <Popover
        placement="bottom end"
        className="w-84.5 overflow-hidden rounded-2xl border border-border-secondary-alt bg-background-white-secondary p-0 shadow-3xl"
      >
        <Header className="flex items-center justify-between border-b border-border-secondary-alt px-5 pt-5 pb-4">
          <Heading level={4} className="leading-6 font-semibold text-text-primary">
            Notifikasi
          </Heading>
          {unreadCount > 0 && (
            <button
              className="text-xs font-medium text-brand-500 hover:underline"
              onClick={() => markRead.mutate("all")}
            >
              Tandai semua dibaca
            </button>
          )}
        </Header>

        <ScrollArea className="h-100 max-h-100">
          <ScrollAreaViewport>
            {!items.length ? (
              <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 px-6 py-10 text-center">
                <span className="text-3xl">🔔</span>
                <p className="text-sm font-medium text-text-primary">Belum ada notifikasi</p>
                <p className="text-xs text-text-tertiary">Notifikasi booking & verifikasi akan muncul di sini</p>
              </div>
            ) : (
              <ul className="px-3 py-2">
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      className={cn(
                        "group flex w-full cursor-pointer gap-3.5 rounded-lg px-3 py-3 transition-colors duration-300 hover:bg-background-gray-secondary_alt",
                        !n.is_read && "bg-brand-50/60",
                      )}
                      onClick={() => {
                        if (!n.is_read) markRead.mutate(n.id);
                        setIsOpen(false);
                        if (n.link) router.push(n.link);
                      }}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-secondary bg-background-gray-primary text-lg">
                        {n.title.includes("ditolak") || n.title.includes("diakhiri") ? "❌" : n.title.includes("Booking") ? "📅" : n.title.includes("Kontrak") ? "📝" : "✅"}
                      </span>
                      <div className="min-w-0 flex-1 text-start">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm leading-5 font-semibold text-text-primary">{n.title}</p>
                          {!n.is_read && <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />}
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs leading-4 text-text-secondary">{n.body}</p>
                        <p className="mt-2 text-xs leading-4 text-text-tertiary">{timeAgo(n.created_at)}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </ScrollAreaViewport>
          <ScrollBar />
        </ScrollArea>
      </Popover>
    </OverlayWrapper>
  );
}
