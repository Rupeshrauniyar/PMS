import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronLeft,
  CheckCheck,
  Sparkles,
  CalendarCheck,
  CalendarClock,
  UserCheck,
  CheckCircle2,
  XCircle,
  Ban,
  AlertTriangle,
  Building2,
  CreditCard,
} from "lucide-react";

import api from "../../api/client";
import { AppContext } from "../../contexts/AppContext";
import { resolveNotificationTarget } from "../../utils/notificationRoutes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

function getKindMeta(kind) {
  switch (kind) {
    case "listing_live":
      return { icon: Building2, tone: "bg-brand-soft text-brand" };
    case "visit_requested":
      return { icon: CalendarClock, tone: "bg-warning-soft text-warning" };
    case "visit_owner_approved":
    case "visit_pool_new":
      return { icon: Sparkles, tone: "bg-info-soft text-info" };
    case "visit_claimed":
    case "visit_reassigned":
      return { icon: UserCheck, tone: "bg-brand-soft text-brand" };
    case "visit_scheduled":
    case "visit_rescheduled":
    case "visit_reminder":
      return { icon: CalendarCheck, tone: "bg-success-soft text-success" };
    case "visit_completed":
    case "booking_confirmed":
      return { icon: CheckCircle2, tone: "bg-success-soft text-success" };
    case "visit_owner_rejected":
    case "booking_rejected":
      return { icon: XCircle, tone: "bg-danger-soft text-destructive" };
    case "visit_no_show":
      return { icon: AlertTriangle, tone: "bg-danger-soft text-destructive" };
    case "visit_cancelled":
    case "visit_released":
    case "booking_cancelled":
      return { icon: Ban, tone: "bg-muted text-muted-foreground" };
    case "booking_new":
      return { icon: CreditCard, tone: "bg-brand-soft text-brand" };
    default:
      return { icon: Bell, tone: "bg-secondary text-foreground" };
  }
}

const Notifications = () => {
  const { user, refreshUser } = useContext(AppContext);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    if (!user?._id) {
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
  }, [user?._id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    try {
      setMarkingAll(true);
      await api.post("/api/auth/notifications/read-all");
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast({
        title: "All notifications marked as read",
        variant: "success",
      });
    } catch {
      toast({
        title: "Could not mark notifications read",
        variant: "error",
      });
    } finally {
      setMarkingAll(false);
    }
  };

  const handleOpenItem = async (n) => {
    if (!n?._id) return;
    if (!n.read) {
      try {
        await api.patch(`/api/auth/notifications/${n._id}/read`);
        setItems((prev) =>
          prev.map((x) => (x._id === n._id ? { ...x, read: true } : x)),
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        /* non-fatal */
      }
    }
    const target = resolveNotificationTarget(n, user);
    refreshUser?.();
    navigate(target);
  };

  const groups = useMemo(() => {
    const unread = items.filter((n) => !n.read);
    const earlier = items.filter((n) => n.read);
    const out = [];
    if (unread.length > 0) out.push({ label: "New", list: unread });
    if (earlier.length > 0) out.push({ label: unread.length > 0 ? "Earlier" : "All Activity", list: earlier });
    return out;
  }, [items]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-5 sm:py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                Notifications
              </h1>
              {unreadCount > 0 ? (
                <Badge variant="brand">{unreadCount} unread</Badge>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              Updates on your site visits, listings, and reservations
            </p>
          </div>
        </div>

        {unreadCount > 0 ? (
          <Button
            variant="outline"
            size="sm"
            loading={markingAll}
            onClick={handleMarkAllRead}
          >
            <CheckCheck className="size-4" aria-hidden="true" />
            <span>Mark all read</span>
          </Button>
        ) : null}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-22 rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="You're all caught up"
          description="Updates on site visits, broker assignments, and property bookings will appear here."
        />
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <section key={group.label} className="flex flex-col gap-2.5">
              <h2 className="px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </h2>
              <ul className="flex flex-col gap-2">
                {group.list.map((n) => {
                  const { icon: Icon, tone } = getKindMeta(n.kind);
                  return (
                    <li key={n._id}>
                      <button
                        type="button"
                        onClick={() => handleOpenItem(n)}
                        className={cn(
                          "flex w-full items-start gap-3.5 rounded-2xl border p-4 text-left transition-all hover:border-foreground/20 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                          !n.read
                            ? "border-brand/35 bg-brand-soft/30 shadow-soft"
                            : "border-border/70 bg-card",
                        )}
                      >
                        <div
                          className={cn(
                            "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl",
                            tone,
                          )}
                        >
                          <Icon className="size-5" aria-hidden="true" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-bold leading-snug text-foreground">
                              {n.title || "Notification"}
                            </p>
                            <div className="flex shrink-0 items-center gap-1.5">
                              <span className="text-[11px] font-medium text-muted-foreground">
                                {timeAgo(n.createdAt)}
                              </span>
                              {!n.read ? (
                                <span
                                  aria-label="Unread"
                                  className="size-2 rounded-full bg-brand"
                                />
                              ) : null}
                            </div>
                          </div>
                          {n.body ? (
                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                              {n.body}
                            </p>
                          ) : null}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
