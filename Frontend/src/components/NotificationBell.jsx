import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import api from "../api/client";

/**
 * Navbar entry: links to `/notifications` and shows unread badge (polls lightly).
 */
export function NotificationBell({ user }) {
  const [unreadCount, setUnreadCount] = useState(0);

  const loadCount = useCallback(async () => {
    if (!user) return;
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
  }, [user]);

  useEffect(() => {
    loadCount();
    const iv = setInterval(loadCount, 60_000);
    return () => clearInterval(iv);
  }, [loadCount]);

  if (!user) return null;

  return (
    <Link
      to="/notifications"
      aria-label="Notifications"
      className="relative rounded-full p-2 hover:bg-accent text-foreground transition-colors"
    >
      <Bell className="w-[1.125rem] h-[1.125rem] sm:w-5 sm:h-5" />
      {unreadCount > 0 ? (
        <span className="absolute -top-0.5 -right-0.5 min-w-[1rem] h-4 px-[3px] rounded-full bg-red-600 text-[10px] font-bold leading-4 text-white flex items-center justify-center border border-background tabular-nums">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
