import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, RefreshCw } from "lucide-react";

import { useLive } from "@/contexts/LiveContext";
import { timeAgo } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export default function Notifications() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const live = useLive();
  const [markingAll, setMarkingAll] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const notifications = useMemo(
    () => live?.notifications ?? [],
    [live?.notifications],
  );
  const unreadCount = live?.unreadCount ?? 0;
  const loading = live?.notifLoading ?? false;
  const error = live?.notifError ?? null;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await live?.refreshNotifications?.();
    } finally {
      setRefreshing(false);
    }
  };

  const handleMarkAll = async () => {
    if (unreadCount === 0 || markingAll) return;
    setMarkingAll(true);
    try {
      await live?.markAllRead?.();
      toast({ variant: "success", title: "Marked all as read" });
    } catch {
      toast({ variant: "error", title: "Could not mark all as read" });
    } finally {
      setMarkingAll(false);
    }
  };

  const handleOpen = (n) => {
    if (!n.read) live?.markRead?.(n._id);
    if (n.bookingId) navigate(`/visits/${n.bookingId}`);
    else if (n.kind === "visit_pool_new") navigate("/pool");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Notifications
          </h1>
          {unreadCount > 0 ? (
            <span className="text-xs font-semibold text-muted-foreground tabular-nums">
              {unreadCount} new
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAll}
              loading={markingAll}
              className="rounded-full"
            >
              Mark all read
            </Button>
          ) : null}
          <button
            type="button"
            onClick={handleRefresh}
            aria-label="Refresh"
            className="inline-flex size-9 items-center justify-center rounded-full border border-border hover:bg-accent"
          >
            <RefreshCw
              className={`size-4 ${refreshing ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {error ? (
        <EmptyState
          icon={Bell}
          title="Could not load notifications"
          action={
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              Retry
            </Button>
          }
        />
      ) : loading ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map((k) => (
            <Skeleton key={k} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" />
      ) : (
        <div className="divide-y divide-border rounded-2xl border border-border">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={cn(
                "flex items-start justify-between gap-3 p-4 transition-colors hover:bg-secondary/30",
                !n.read && "bg-secondary/20",
              )}
            >
              <button
                type="button"
                onClick={() => handleOpen(n)}
                className="flex min-w-0 flex-1 items-start gap-3 text-left"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    n.read ? "bg-transparent" : "bg-foreground",
                  )}
                />
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <p
                      className={cn(
                        "truncate text-sm text-foreground",
                        n.read ? "font-medium" : "font-bold",
                      )}
                    >
                      {n.title || "Update"}
                    </p>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>
                  {n.body ? (
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {n.body}
                    </p>
                  ) : null}
                </div>
              </button>

              {!n.read ? (
                <button
                  type="button"
                  onClick={() => live?.markRead?.(n._id)}
                  aria-label="Mark read"
                  className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Check className="size-3.5" aria-hidden="true" />
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
