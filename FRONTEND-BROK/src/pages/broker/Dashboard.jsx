import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  RefreshCw,
  Inbox,
  CalendarClock,
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  MapPin,
  Clock,
  User,
  Building2,
  Sparkles,
} from "lucide-react";

import { useApp } from "@/contexts/AppContext";
import { useLive } from "@/contexts/LiveContext";
import { useDashboard } from "@/hooks/useVisits";
import { timeAgo } from "@/lib/format";
import { formatVisitDate, formatVisitTimeRange } from "@/lib/visit";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleBadge } from "@/components/broker/BrokerBrand";
import { VisitCard } from "@/components/broker/VisitCard";
import { ScheduleMeetSheet } from "@/components/broker/ScheduleMeetSheet";
import { cn } from "@/lib/utils";

function greetingForHour(hour = new Date().getHours()) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function isSameLocalDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function Dashboard() {
  const { user } = useApp();
  const live = useLive();
  const {
    counts,
    upcoming,
    needsScheduling,
    loading,
    needsSchedulingLoading,
    refreshing,
    error,
    refetch,
  } = useDashboard();

  const [scheduleTarget, setScheduleTarget] = useState(null);

  const firstName = useMemo(() => {
    const raw = user?.username?.trim() || "Broker";
    return raw.split(/\s+/)[0];
  }, [user?.username]);

  const handleRefresh = () => {
    refetch();
    live?.refreshAll?.();
  };

  const statCards = useMemo(
    () => [
      {
        key: "pool",
        label: "Open Pool",
        value: counts?.pool ?? live?.poolCount ?? 0,
        to: "/pool",
        icon: Inbox,
        accent: "text-brand bg-brand-soft",
        highlight: (counts?.pool ?? 0) > 0,
        sub: "Unclaimed requests",
      },
      {
        key: "claimed",
        label: "Needs Scheduling",
        value: counts?.claimed ?? 0,
        to: "/visits?tab=claimed",
        icon: CalendarClock,
        accent: "text-warning bg-warning-soft",
        highlight: (counts?.claimed ?? 0) > 0,
        sub: "Awaiting 3-way slot",
      },
      {
        key: "scheduled",
        label: "Scheduled",
        value: counts?.scheduled ?? 0,
        to: "/visits?tab=scheduled",
        icon: CalendarCheck,
        accent: "text-info bg-info-soft",
        sub: "Confirmed meets",
      },
      {
        key: "completed",
        label: "Completed",
        value: counts?.completed ?? 0,
        to: "/visits?tab=closed",
        icon: CheckCircle2,
        accent: "text-success bg-success-soft",
        sub: "Conducted tours",
      },
      {
        key: "noShow",
        label: "No-show",
        value: counts?.noShow ?? 0,
        to: "/visits?tab=closed",
        icon: AlertTriangle,
        accent: "text-destructive bg-danger-soft",
        sub: "Missed visits",
      },
    ],
    [counts, live?.poolCount],
  );

  const groupedAgenda = useMemo(() => {
    const now = new Date();
    const sorted = [...upcoming].sort(
      (a, b) =>
        new Date(a?.schedule?.startAt || 0).getTime() -
        new Date(b?.schedule?.startAt || 0).getTime(),
    );
    const today = [];
    const later = [];
    for (const v of sorted) {
      const d = v?.schedule?.startAt ? new Date(v.schedule.startAt) : null;
      if (d && !Number.isNaN(d.getTime()) && isSameLocalDay(d, now)) {
        today.push(v);
      } else {
        later.push(v);
      }
    }
    return { today, later };
  }, [upcoming]);

  return (
    <div className="space-y-8">
      {/* Hero Greeting */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              {greetingForHour()}, {firstName}
            </h1>
            <RoleBadge role={user?.role} />
          </div>
          <p className="text-sm text-muted-foreground">
            Claim owner-approved requests, coordinate 3-way site visits, and keep every party on schedule.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            loading={refreshing}
            aria-label="Refresh dashboard"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            <span>Refresh</span>
          </Button>
          <Button variant="brand" size="sm" asChild>
            <Link to="/pool">
              <Inbox className="size-4" aria-hidden="true" />
              <span>Open Pool</span>
              {(counts?.pool ?? 0) > 0 ? (
                <span className="ml-0.5 rounded-full bg-white/20 px-1.5 py-0.2 text-[11px] font-extrabold">
                  {counts.pool}
                </span>
              ) : null}
            </Link>
          </Button>
        </div>
      </header>

      {error ? (
        <EmptyState
          icon={AlertTriangle}
          title="Couldn't load dashboard metrics"
          description={error.message}
          action={
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              Try again
            </Button>
          }
        />
      ) : null}

      {/* Stat Cards */}
      <section aria-label="Broker overview counts">
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((k) => (
              <Skeleton key={k} className="h-28 rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {statCards.map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.key}
                  to={s.to}
                  className={cn(
                    "group relative flex flex-col justify-between gap-3 rounded-3xl border p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    s.highlight
                      ? "border-brand/40 bg-card ring-1 ring-brand/15"
                      : "border-border/75 bg-card",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "flex size-9 items-center justify-center rounded-xl",
                        s.accent,
                      )}
                    >
                      <Icon className="size-4.5" aria-hidden="true" />
                    </span>
                    {s.highlight ? (
                      <span className="size-2 rounded-full bg-brand animate-pulse" aria-hidden="true" />
                    ) : (
                      <ArrowRight
                        className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold tracking-tight text-foreground">
                      {s.value}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-foreground/90">
                      {s.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{s.sub}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Action Needed — Schedule Now */}
      <section aria-labelledby="needs-scheduling-heading" className="space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 id="needs-scheduling-heading" className="text-lg font-bold tracking-tight">
              Action Needed — Schedule Now
            </h2>
            {needsScheduling.length > 0 ? (
              <Badge variant="brand">{needsScheduling.length}</Badge>
            ) : null}
          </div>
          {needsScheduling.length > 0 ? (
            <Link
              to="/visits?tab=claimed"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
            >
              <span>View all claimed</span>
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          ) : null}
        </div>

        {needsSchedulingLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-44 w-full rounded-3xl" />
          </div>
        ) : needsScheduling.length === 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border/70 bg-card/70 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-success-soft text-success">
                <Sparkles className="size-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  All claimed visits are scheduled
                </p>
                <p className="text-xs text-muted-foreground">
                  Check the Open Pool to claim new owner-approved site visit requests.
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/pool">Browse Open Pool</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {needsScheduling.slice(0, 4).map((visit) => (
              <VisitCard
                key={visit._id}
                visit={visit}
                actions={
                  <>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/visits/${visit._id}`}>Details</Link>
                    </Button>
                    <Button
                      variant="brand"
                      size="sm"
                      onClick={() => setScheduleTarget(visit)}
                    >
                      <CalendarClock className="size-4" aria-hidden="true" />
                      <span>Schedule Meet</span>
                    </Button>
                  </>
                }
              />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming 7-Day Agenda */}
      <section aria-labelledby="upcoming-agenda-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 id="upcoming-agenda-heading" className="text-lg font-bold tracking-tight">
              Upcoming 7-Day Agenda
            </h2>
            <p className="text-xs text-muted-foreground">
              Confirmed site visits scheduled over the next 7 days
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/calendar">
              <span>Full Calendar</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-28 w-full rounded-3xl" />
            <Skeleton className="h-28 w-full rounded-3xl" />
          </div>
        ) : upcoming.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="No visits scheduled in the next 7 days"
            description="Once you confirm a 3-way meet with a buyer and property owner, it will appear right here."
            action={
              <Button variant="brand" size="sm" asChild>
                <Link to="/pool">Claim a Visit from Pool</Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-6">
            {groupedAgenda.today.length > 0 ? (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <Badge variant="success">Today</Badge>
                  <span className="text-xs font-medium text-muted-foreground">
                    {groupedAgenda.today.length}{" "}
                    {groupedAgenda.today.length === 1 ? "visit" : "visits"} today
                  </span>
                </div>
                <div className="space-y-2.5">
                  {groupedAgenda.today.map((v) => (
                    <AgendaRow key={v._id} visit={v} isToday />
                  ))}
                </div>
              </div>
            ) : null}

            {groupedAgenda.later.length > 0 ? (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Upcoming</Badge>
                  <span className="text-xs font-medium text-muted-foreground">
                    Next 7 days
                  </span>
                </div>
                <div className="space-y-2.5">
                  {groupedAgenda.later.map((v) => (
                    <AgendaRow key={v._id} visit={v} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </section>

      <ScheduleMeetSheet
        open={Boolean(scheduleTarget)}
        onOpenChange={(v) => {
          if (!v) setScheduleTarget(null);
        }}
        visit={scheduleTarget}
        onScheduled={() => {
          setScheduleTarget(null);
          handleRefresh();
        }}
      />
    </div>
  );
}

function AgendaRow({ visit, isToday = false }) {
  const prop = visit?.property || {};
  const thumb = prop.images?.[0] || prop.video?.thumbnail || "";
  const startAt = visit?.schedule?.startAt;
  const meetingPoint = visit?.schedule?.meetingPoint || prop.location || "Meeting point TBD";

  return (
    <Link
      to={`/visits/${visit._id}`}
      className={cn(
        "group flex flex-col gap-3 rounded-3xl border p-3.5 shadow-soft transition-all hover:shadow-card sm:flex-row sm:items-center sm:p-4",
        isToday
          ? "border-success/35 bg-card"
          : "border-border/75 bg-card",
      )}
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div className="relative h-18 w-24 shrink-0 overflow-hidden rounded-2xl bg-muted">
          {thumb ? (
            <img
              src={thumb}
              alt={prop.title || "Property"}
              width={160}
              height={120}
              loading="lazy"
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <Building2 className="size-5 opacity-55" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-brand">
            <Clock className="size-3.5 shrink-0" aria-hidden="true" />
            <span>{formatVisitDate(startAt)}</span>
            <span className="font-medium text-muted-foreground">
              · {formatVisitTimeRange(startAt, visit?.schedule?.durationMin)}
            </span>
          </div>

          <p className="truncate text-sm font-bold text-foreground group-hover:text-brand">
            {prop.title || "Property Visit"}
          </p>

          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{meetingPoint}</span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-2.5 text-xs text-muted-foreground sm:border-t-0 sm:pt-0 sm:justify-end">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <User className="size-3.5 text-brand" aria-hidden="true" />
            <strong className="font-semibold text-foreground">
              {visit.buyer?.username || "Buyer"}
            </strong>
          </span>
          <span className="inline-flex items-center gap-1">
            <Building2 className="size-3.5 text-info" aria-hidden="true" />
            <strong className="font-semibold text-foreground">
              {visit.owner?.username || "Owner"}
            </strong>
          </span>
        </div>
        {visit.claimedAt ? (
          <span className="sr-only">Claimed {timeAgo(visit.claimedAt)}</span>
        ) : null}
        <ArrowRight
          className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}
