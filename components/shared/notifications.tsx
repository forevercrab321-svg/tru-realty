"use client";
import * as React from "react";
import Link from "next/link";
import {
  Bell, CalendarClock, CircleAlert, FileWarning, Megaphone, Sparkles, Wallet, Clock,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { useSession } from "@/lib/session";
import { relative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { NotificationKind } from "@/types";

const ICONS: Record<NotificationKind, React.ReactNode> = {
  new_lead: <Sparkles />, transaction_update: <FileWarning />, document_request: <FileWarning />,
  closing_reminder: <CalendarClock />, license_expiration: <CircleAlert />,
  event_reminder: <Clock />, commission_payment: <Wallet />, announcement: <Megaphone />,
};

export function NotificationCenter() {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useStore();
  const { account } = useSession();
  const mine = notifications.filter((n) => !account || n.audience.includes(account.role));
  const unread = mine.filter((n) => !n.read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative flex size-8 items-center justify-center rounded-[7px] text-ink-3 transition-colors hover:bg-subtle hover:text-ink" aria-label="Notifications">
          <Bell className="size-[17px]" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex size-[15px] items-center justify-center rounded-full bg-risk-500 text-[9.5px] font-semibold text-white ring-2 ring-surface">
              {unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[368px] p-0">
        <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
          <p className="text-[13px] font-semibold text-ink">Notifications</p>
          {unread > 0 && (
            <button onClick={markAllNotificationsRead} className="text-[12px] text-brand-700 hover:underline">
              Mark all read
            </button>
          )}
        </div>
        <div className="thin-scrollbar max-h-[360px] overflow-y-auto">
          {mine.map((n) => (
            <Link
              key={n.id}
              href={n.href}
              onClick={() => markNotificationRead(n.id)}
              className={cn("flex gap-2.5 border-b border-line/70 px-3.5 py-3 transition-colors last:border-0 hover:bg-canvas", !n.read && "bg-brand-50/40")}
            >
              <span className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-[7px] [&_svg]:size-3.5",
                n.read ? "bg-subtle text-ink-4" : "bg-brand-100 text-brand-700")}>
                {ICONS[n.kind]}
              </span>
              <div className="min-w-0">
                <p className={cn("text-[13px] leading-snug", n.read ? "text-ink-2" : "font-medium text-ink")}>{n.title}</p>
                <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-relaxed text-ink-3">{n.body}</p>
                <p className="mt-1 text-[11.5px] text-ink-4">{relative(n.createdAt)}</p>
              </div>
            </Link>
          ))}
        </div>
        <div className="border-t border-line p-2">
          <Button variant="ghost" size="sm" full asChild>
            <Link href={account?.portal === "agent" ? "/agent/dashboard" : "/admin/dashboard"}>View all activity</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
