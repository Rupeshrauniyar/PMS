import React, { useCallback, useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, ChevronLeft } from "lucide-react";
import api from "../../api/client";
import { AppContext } from "../../contexts/AppContext";
import { resolveNotificationPath } from "../../utils/notificationRoutes";

function formatWhen(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

const Notifications = () => {
  const { user, refreshUser } = useContext(AppContext);
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data } = await api.get("/api/auth/notifications");
      const list = data?.notifications ?? [];
      setItems(list);
      setUnreadCount(
        typeof data?.unreadCount === "number"
          ? data.unreadCount
          : list.filter((n) => !n.read).length,
      );
    } catch {
      setItems([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const onOpen = async (n) => {
    if (!n?._id) return;
    if (!n.read) {
      try {
        await api.patch(`/api/auth/notifications/${n._id}/read`);
        setItems((prev) =>
          prev.map((x) => (x._id === n._id ? { ...x, read: true } : x)),
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        /* ignore */
      }
    }

    const pid = n.propId;
    const path = pid
      ? resolveNotificationPath(pid, n.kind, user)
      : "/";
    navigate(path);
    refreshUser?.();
  };

  if (!user) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center px-4 pt-24 pb-16 text-center">
        <p className="text-sm text-muted-foreground mb-4">Sign in to see notifications.</p>
        <Link
          to="/signin"
          className="text-sm font-semibold text-foreground underline underline-offset-2"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto pt-20 pb-24 ">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-accent text-foreground"
          aria-label="Go back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Bell className="w-5 h-5 text-muted-foreground shrink-0" />
          <h1 className="text-lg font-semibold truncate">Notifications</h1>
          {unreadCount > 0 ? (
            <span className="text-xs font-medium text-muted-foreground tabular-nums">
              ({unreadCount} new)
            </span>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-border bg-muted/40 h-24"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            No notifications yet. Bookings and new listings will appear here.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((n) => (
            <li key={n._id}>
              <button
                type="button"
                onClick={() => onOpen(n)}
                className={`w-full text-left rounded-2xl border border-border px-4 py-3 transition-colors hover:bg-accent/50 ${
                  !n.read ? "bg-accent/25 border-foreground/15" : "bg-card"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-sm font-semibold leading-snug">
                    {n.title}
                  </span>
                  {!n.read ? (
                    <span className="shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                  ) : null}
                </div>
                {n.body ? (
                  <p className="text-xs text-muted-foreground line-clamp-3 mb-2">
                    {n.body}
                  </p>
                ) : null}
                <p className="text-[11px] text-muted-foreground/80">
                  {formatWhen(n.createdAt)}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Notifications;
