import React, { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell } from "lucide-react";
import api from "../api/client";
import { cn } from "@/lib/utils";

/**
 * Navbar entry: links to `/notifications` and shows unread badge.
 */
export function NotificationBell({ user, className }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  const loadCount = useCallback(async () => {
    if (!user?._id) {
      setUnreadCount(0);
      return;
    }
    try {
      const { data } = await api.get("/api/auth/notifications");
      const list = data?.notifications ?? [];
      const u =
        typeof data?.unreadCount === "number"
          ? data.unreadCount
          : list.filter((n) => !n.read).length;
      setUnreadCount(u);
    } catch {
      setUnreadCount(0);
    }
  }, [user?._id]);

  useEffect(() => {
    loadCount();
  }, [loadCount, location.pathname]);

  useEffect(() => {
    if (!user?._id) return undefined;
    const iv = setInterval(loadCount, 60_000);
    return () => clearInterval(iv);
  }, [loadCount, user?._id]);

  if (!user) return null;

  return (
    <Link
      to="/notifications"
      aria-label={
        unreadCount > 0
          ? `Notifications (${unreadCount} unread)`
          : "Notifications"
      }
      className={cn(
        "relative inline-flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        className,
      )}
    >
      <Bell className="size-5" aria-hidden="true" />
      {unreadCount > 0 ? (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold leading-none text-brand-foreground ring-2 ring-background tabular-nums">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
