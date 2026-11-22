import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  RefreshCw,
  MapPin,
  Download,
} from "lucide-react";

import { useMyVisits } from "@/hooks/useVisits";
import { buildMapsUrl, downloadIcs, formatVisitTimeRange } from "@/lib/visit";
import { Button } from "@/components/ui/button";
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
  const day = d.getDay();
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

  const selectedHeading = useMemo(
    () =>
      new Intl.DateTimeFormat("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }).format(selectedDay),
    [selectedDay],
  );

  return (
    <div className="space-y-6 py-2">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Calendar</h1>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedDay(addDays(selectedDay, -7))}
            aria-label="Previous week"
            className="inline-flex size-9 items-center justify-center rounded-full border border-border hover:bg-accent"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedDay(startOfLocalDay(new Date()))}
            className="rounded-full px-3.5"
          >
            Today
          </Button>
          <button
            type="button"
            onClick={() => setSelectedDay(addDays(selectedDay, 7))}
            aria-label="Next week"
            className="inline-flex size-9 items-center justify-center rounded-full border border-border hover:bg-accent"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={refetch}
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

      {/* 7-Day Strip */}
      <div className="grid grid-cols-7 gap-1.5">
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
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl border py-2.5 text-center transition-colors",
                isSelected
                  ? "border-foreground bg-foreground text-background"
                  : isToday
                    ? "border-foreground/40 bg-secondary/60 text-foreground"
                    : "border-border bg-background text-foreground hover:bg-secondary/40",
              )}
            >
              <span
                className={cn(
                  "text-[10px] font-semibold uppercase",
                  isSelected ? "text-background/80" : "text-muted-foreground",
                )}
              >
                {weekdayShort}
              </span>
              <span className="text-base font-bold tabular-nums leading-none">
                {d.getDate()}
              </span>
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  count > 0
                    ? isSelected
                      ? "bg-background"
                      : "bg-foreground"
                    : "bg-transparent",
                )}
              />
            </button>
          );
        })}
      </div>

      {/* Day Agenda */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">{selectedHeading}</h2>
          <span className="text-xs text-muted-foreground tabular-nums">
            {dayAgenda.length} {dayAgenda.length === 1 ? "visit" : "visits"}
          </span>
        </div>

        {error ? (
          <EmptyState
            icon={CalendarDays}
            title="Could not load schedule"
            action={
              <Button variant="outline" size="sm" onClick={refetch}>
                Retry
              </Button>
            }
          />
        ) : loading ? (
          <div className="space-y-2.5">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        ) : dayAgenda.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No visits scheduled"
            action={
              <Button variant="outline" size="sm" asChild className="rounded-full px-5">
                <Link to="/pool">Open Pool</Link>
              </Button>
            }
          />
        ) : (
          <div className="divide-y divide-border rounded-2xl border border-border">
            {dayAgenda.map((visit) => {
              const prop = visit.property || {};
              const meetingPoint =
                visit.schedule?.meetingPoint || prop.location || "Property";
              return (
                <div
                  key={visit._id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <Link to={`/visits/${visit._id}`} className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-xs font-semibold tabular-nums text-foreground">
                      {formatVisitTimeRange(
                        visit.schedule?.startAt,
                        visit.schedule?.durationMin,
                      )}
                    </p>
                    <p className="truncate text-sm font-bold text-foreground">
                      {prop.title || "Property"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {meetingPoint} · {visit.buyer?.username || "Buyer"}
                    </p>
                  </Link>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (downloadIcs(visit)) {
                          toast({ title: "Calendar (.ics) downloaded" });
                        }
                      }}
                      aria-label="Download .ics"
                      className="inline-flex size-8 items-center justify-center rounded-full border border-border text-foreground hover:bg-accent"
                    >
                      <Download className="size-3.5" aria-hidden="true" />
                    </button>
                    <a
                      href={buildMapsUrl(meetingPoint)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Open Maps"
                      className="inline-flex size-8 items-center justify-center rounded-full border border-border text-foreground hover:bg-accent"
                    >
                      <MapPin className="size-3.5" aria-hidden="true" />
                    </a>
                    <Button variant="outline" size="sm" asChild className="rounded-full">
                      <Link to={`/visits/${visit._id}`}>Open</Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
