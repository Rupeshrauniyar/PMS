import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  Check,
  RefreshCw,
  Inbox,
  UserCheck,
  Undo2,
  CalendarCheck,
  CalendarClock,
  Ban,
  CheckCircle2,
  AlertTriangle,
  AlarmClock,
  ShieldCheck,
  Building2,
} from "lucide-react";

import { useLive } from "@/contexts/LiveContext";
import { timeAgo } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const KIND_META = {
  visit_pool_new: { icon: Inbox, tone: "text-brand bg-brand-soft" },
  visit_claimed: { icon: UserCheck, tone: "text-brand bg-brand-soft" },
  visit_released: { icon: Undo2, tone: "text-warning bg-warning-soft" },
  visit_scheduled: { icon: CalendarCheck, tone: "text-success bg-success-soft" },
  visit_rescheduled: { icon: CalendarClock, tone: "text-info bg-info-soft" },
  visit_cancelled: { icon: Ban, tone: "text-muted-foreground bg-muted" },
  visit_completed: { icon: CheckCircle2, tone: "text-success bg-success-soft" },
  visit_no_show: { icon: AlertTriangle, tone: "text-destructive bg-danger-soft" },
  visit_reminder: { icon: AlarmClock, tone: "text-warning bg-warning-soft" },
  visit_reassigned: { icon: ShieldCheck, tone: "text-brand bg-brand-soft" },
  visit_requested: { icon: Inbox, tone: "text-info bg-info-soft" },
  visit_owner_approved: { icon: CheckCircle2, tone: "text-info bg-info-soft" },
  visit_owner_rejected: { icon: Ban, tone: "text-destructive bg-danger-soft" },
  listing_live: { icon: Building2, tone: "text-info bg-info-soft" },
  booking_new: { icon: Inbox, tone: "text-brand bg-brand-soft" },
  booking_confirmed: { icon: CheckCircle2, tone: "text-success bg-success-soft" },
  booking_rejected: { icon: Ban, tone: "text-destructive bg-danger-soft" },
  booking_cancelled: { icon: Ban, tone: "text-muted-foreground bg-muted" },
};

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

  const { unread, earlier } = useMemo(() => {
    const u = [];
    const e = [];
    for (const n of notifications) {
      if (n.read) e.push(n);
      else u.push(n);
    }
    return { unread: u, earlier: e };
  }, [notifications]);

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
      toast({ variant: "success", title: "All notifications marked as read" });
    } catch {
      toast({ variant: "error", title: "Couldn't mark all as read" });
    } finally {
      setMarkingAll(false);
    }
  };

  const handleOpenNotification = (n) => {
    if (!n.read) {
      live?.markRead?.(n._id);
    }
    if (n.bookingId) {
      navigate(`/visits/${n.bookingId}`);
    } else if (n.kind === "visit_pool_new") {
      navigate("/pool");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Notifications
            </h1>
            {unreadCount > 0 ? (
              <Badge variant="destructive">{unreadCount} unread</Badge>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            Real-time alerts for open pool requests, schedule changes, reminders, and assignments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            loading={refreshing}
            aria-label="Refresh notifications"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            <span>Refresh</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleMarkAll}
            loading={markingAll}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="size-4" aria-hidden="true" />
            <span>Mark all read</span>
          </Button>
        </div>
      </header>

      {error ? (
        <EmptyState
          icon={Bell}
          title="Couldn't load notifications"
          description={error}
          action={
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              Retry
            </Button>
          }
        />
      ) : loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((k) => (
            <Skeleton key={k} className="h-22 w-full rounded-3xl" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="You're all caught up"
          description="Alerts for newly owner-approved pool requests, visit confirmations, and reminders will show up here."
        />
      ) : (
        <div className="space-y-6">
          {unread.length > 0 ? (
            <section aria-labelledby="unread-notif-heading" className="space-y-2.5">
              <h2
                id="unread-notif-heading"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                New ({unread.length})
              </h2>
              <div className="space-y-2">
                {unread.map((n) => (
                  <NotificationItem
                    key={n._id}
                    item={n}
                    onSelect={() => handleOpenNotification(n)}
                    onMarkRead={() => live?.markRead?.(n._id)}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {earlier.length > 0 ? (
            <section aria-labelledby="earlier-notif-heading" className="space-y-2.5">
              <h2
                id="earlier-notif-heading"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                Earlier
              </h2>
              <div className="space-y-2">
                {earlier.map((n) => (
                  <NotificationItem
                    key={n._id}
                    item={n}
                    onSelect={() => handleOpenNotification(n)}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}

function NotificationItem({ item, onSelect, onMarkRead }) {
  const meta = KIND_META[item.kind] || {
    icon: Bell,
    tone: "text-brand bg-brand-soft",
  };
  const Icon = meta.icon;
  const actionable = Boolean(item.bookingId || item.kind === "visit_pool_new");

  return (
    <div
      className={cn(
        "group relative flex items-start gap-3.5 rounded-3xl border p-4 transition-all",
        item.read
          ? "border-border/65 bg-card/70 text-foreground hover:bg-card"
          : "border-brand/35 bg-card shadow-soft ring-1 ring-brand/10 hover:shadow-card",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "flex min-w-0 flex-1 items-start gap-3.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-2xl",
          !actionable && "cursor-default",
        )}
      >
        <span
          className={cn(
            "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl",
            meta.tone,
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p
              className={cn(
                "text-sm leading-snug",
                item.read ? "font-semibold text-foreground/90" : "font-bold text-foreground",
              )}
            >
              {item.title || "Notification"}
            </p>
            <span className="text-[11px] font-medium text-muted-foreground">
              {timeAgo(item.createdAt)}
            </span>
          </div>

          {item.body ? (
            <p className="text-xs leading-relaxed text-muted-foreground">
              {item.body}
            </p>
          ) : null}

          {item.bookingId ? (
            <span className="inline-block pt-0.5 text-[11px] font-semibold text-brand group-hover:underline">
              Open site visit →
            </span>
          ) : item.kind === "visit_pool_new" ? (
            <span className="inline-block pt-0.5 text-[11px] font-semibold text-brand group-hover:underline">
              Open request pool →
            </span>
          ) : null}
        </div>
      </button>

      {!item.read && onMarkRead ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMarkRead();
          }}
          aria-label="Mark notification as read"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <Check className="size-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
