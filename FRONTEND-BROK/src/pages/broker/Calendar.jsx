import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  RefreshCw,
  Clock,
  MapPin,
  Download,
  ExternalLink,
  Building2,
  User,
  ArrowRight,
} from "lucide-react";

import { useMyVisits } from "@/hooks/useVisits";
import { buildMapsUrl, downloadIcs, formatVisitTimeRange } from "@/lib/visit";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

function startOfLocalDay(d) {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function startOfWeekMonday(date) {
  const d = startOfLocalDay(date);
  const day = d.getDay(); // 0 = Sun, 1 = Mon...
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function dayKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function Calendar() {
  const { toast } = useToast();
  const today = useMemo(() => startOfLocalDay(new Date()), []);
  const [selectedDay, setSelectedDay] = useState(() => startOfLocalDay(new Date()));

  const weekStart = useMemo(() => startOfWeekMonday(selectedDay), [selectedDay]);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const rangeIso = useMemo(() => {
    const start = new Date(weekStart);
    start.setHours(0, 0, 0, 0);
    const end = addDays(weekStart, 6);
    end.setHours(23, 59, 59, 999);
    return { from: start.toISOString(), to: end.toISOString() };
  }, [weekStart]);

  const { visits, loading, refreshing, error, refetch } = useMyVisits({
    status: "scheduled",
    from: rangeIso.from,
    to: rangeIso.to,
  });

  const visitsByDay = useMemo(() => {
    const map = new Map();
    for (const v of visits) {
      const startAt = v?.schedule?.startAt;
      if (!startAt) continue;
      const key = dayKey(startAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(v);
    }
    for (const [, arr] of map) {
      arr.sort(
        (a, b) =>
          new Date(a.schedule?.startAt || 0).getTime() -
          new Date(b.schedule?.startAt || 0).getTime(),
      );
    }
    return map;
  }, [visits]);

  const selectedKey = dayKey(selectedDay);
  const todayKey = dayKey(today);
  const dayAgenda = visitsByDay.get(selectedKey) || [];

  const weekRangeLabel = useMemo(() => {
    const first = weekDays[0];
    const last = weekDays[6];
    const fmt = new Intl.DateTimeFormat("en-IN", { month: "short", day: "numeric" });
    return `${fmt.format(first)} – ${fmt.format(last)}, ${last.getFullYear()}`;
  }, [weekDays]);

  const selectedHeading = useMemo(
    () =>
      new Intl.DateTimeFormat("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(selectedDay),
    [selectedDay],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Visit Calendar
          </h1>
          <p className="text-sm text-muted-foreground">
            7-day schedule of your confirmed site visits across buyers and property owners.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedDay(addDays(selectedDay, -7))}
            aria-label="Previous week"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            <span>Prev week</span>
          </Button>
          <Button
            variant={selectedKey === todayKey ? "secondary" : "outline"}
            size="sm"
            onClick={() => setSelectedDay(startOfLocalDay(new Date()))}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedDay(addDays(selectedDay, 7))}
            aria-label="Next week"
          >
            <span>Next week</span>
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={refetch}
            loading={refreshing}
            aria-label="Refresh calendar"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </header>

      {/* Week Strip */}
      <section
        aria-label={`Week of ${weekRangeLabel}`}
        className="rounded-3xl border border-border/80 bg-card p-3 sm:p-4 shadow-soft"
      >
        <div className="mb-3 flex items-center justify-between px-1">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {weekRangeLabel}
          </p>
          <Badge variant="secondary">
            {visits.length} {visits.length === 1 ? "visit" : "visits"} this week
          </Badge>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {weekDays.map((d) => {
            const key = dayKey(d);
            const isSelected = key === selectedKey;
            const isToday = key === todayKey;
            const count = (visitsByDay.get(key) || []).length;
            const weekdayShort = new Intl.DateTimeFormat("en-IN", {
              weekday: "short",
            }).format(d);

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDay(d)}
                aria-pressed={isSelected}
                aria-label={`${d.toDateString()}${count > 0 ? `, ${count} scheduled visits` : ""}`}
                className={cn(
                  "flex flex-col items-center justify-between gap-1.5 rounded-2xl border px-1.5 py-2.5 text-center transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:py-3",
                  isSelected
                    ? "border-brand bg-brand text-brand-foreground shadow-soft"
                    : isToday
                      ? "border-brand/40 bg-brand-soft/45 text-foreground hover:bg-brand-soft"
                      : "border-border/65 bg-background/60 text-foreground hover:bg-accent",
                )}
              >
                <span
                  className={cn(
                    "text-[11px] font-semibold uppercase",
                    isSelected ? "text-brand-foreground/85" : "text-muted-foreground",
                  )}
                >
                  {weekdayShort}
                </span>
                <span className="text-lg font-extrabold leading-none sm:text-xl">
                  {d.getDate()}
                </span>
                <div className="flex h-4 items-center justify-center">
                  {count > 0 ? (
                    <span
                      className={cn(
                        "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-extrabold leading-4",
                        isSelected
                          ? "bg-white text-black"
                          : "bg-brand text-brand-foreground",
                      )}
                    >
                      {count}
                    </span>
                  ) : (
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-1.5 rounded-full",
                        isToday && !isSelected ? "bg-brand/60" : "bg-transparent",
                      )}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Selected Day Chronological Agenda */}
      <section aria-labelledby="selected-day-heading" className="space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 id="selected-day-heading" className="text-lg font-bold tracking-tight">
              {selectedHeading}
            </h2>
            {selectedKey === todayKey ? <Badge variant="success">Today</Badge> : null}
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {dayAgenda.length} {dayAgenda.length === 1 ? "scheduled meet" : "scheduled meets"}
          </span>
        </div>

        {error ? (
          <EmptyState
            icon={CalendarDays}
            title="Couldn't load calendar schedule"
            description={error.message}
            action={
              <Button variant="outline" size="sm" onClick={refetch}>
                Retry
              </Button>
            }
          />
        ) : loading ? (
          <div className="space-y-3">
            <Skeleton className="h-32 w-full rounded-3xl" />
            <Skeleton className="h-32 w-full rounded-3xl" />
          </div>
        ) : dayAgenda.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No visits scheduled for this day"
            description={
              visits.length > 0
                ? `You have ${visits.length} scheduled ${visits.length === 1 ? "visit" : "visits"} on other days this week — select a highlighted day above.`
                : "Claim a visit from the Open Pool or schedule any claimed visits to populate your agenda."
            }
            action={
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/visits?tab=claimed">Needs Scheduling</Link>
                </Button>
                <Button variant="brand" size="sm" asChild>
                  <Link to="/pool">Open Pool</Link>
                </Button>
              </>
            }
          />
        ) : (
          <div className="space-y-3">
            {dayAgenda.map((visit) => {
              const prop = visit.property || {};
              const thumb = prop.images?.[0] || prop.video?.thumbnail || "";
              const startAt = visit.schedule?.startAt;
              const meetingPoint =
                visit.schedule?.meetingPoint || prop.location || "At property";

              return (
                <article
                  key={visit._id}
                  className="flex flex-col justify-between gap-4 rounded-3xl border border-border/80 bg-card p-4 shadow-soft transition-shadow hover:shadow-card sm:flex-row sm:items-center sm:p-5"
                >
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <Link
                      to={`/visits/${visit._id}`}
                      className="relative h-20 w-28 shrink-0 overflow-hidden rounded-2xl bg-muted"
                    >
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={prop.title || "Property"}
                          width={160}
                          height={120}
                          loading="lazy"
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-muted-foreground">
                          <Building2 className="size-6 opacity-55" aria-hidden="true" />
                        </div>
                      )}
                    </Link>

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-bold text-brand">
                        <Clock className="size-3.5" aria-hidden="true" />
                        <span>
                          {formatVisitTimeRange(startAt, visit.schedule?.durationMin)}
                        </span>
                      </div>

                      <Link
                        to={`/visits/${visit._id}`}
                        className="block truncate text-base font-bold text-foreground hover:text-brand"
                      >
                        {prop.title || "Property Site Visit"}
                      </Link>

                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3.5 shrink-0 text-brand" aria-hidden="true" />
                        <span className="truncate">{meetingPoint}</span>
                      </p>

                      <div className="flex flex-wrap items-center gap-3 pt-0.5 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <User className="size-3.5 text-brand" aria-hidden="true" />
                          <span>Buyer:</span>
                          <strong className="font-semibold text-foreground">
                            {visit.buyer?.username || "Buyer"}
                          </strong>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="size-3.5 text-info" aria-hidden="true" />
                          <span>Owner:</span>
                          <strong className="font-semibold text-foreground">
                            {visit.owner?.username || "Owner"}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3 sm:border-t-0 sm:pt-0 sm:justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (downloadIcs(visit)) {
                          toast({ title: "Calendar (.ics) downloaded" });
                        }
                      }}
                    >
                      <Download className="size-4" aria-hidden="true" />
                      <span>.ics</span>
                    </Button>

                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={buildMapsUrl(meetingPoint)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MapPin className="size-4" aria-hidden="true" />
                        <span>Maps</span>
                        <ExternalLink className="size-3.5 opacity-60" aria-hidden="true" />
                      </a>
                    </Button>

                    <Button variant="default" size="sm" asChild>
                      <Link to={`/visits/${visit._id}`}>
                        <span>Open</span>
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </Link>
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
