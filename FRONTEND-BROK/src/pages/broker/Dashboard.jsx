import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCw, CalendarCheck } from "lucide-react";

import { useApp } from "@/contexts/AppContext";
import { useLive } from "@/contexts/LiveContext";
import { useDashboard } from "@/hooks/useVisits";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { VisitCard } from "@/components/broker/VisitCard";
import { ScheduleMeetSheet } from "@/components/broker/ScheduleMeetSheet";

export default function Dashboard() {
  const { user } = useApp();
  const live = useLive();
  const {
    counts,
    upcoming,
    needsScheduling,
    loading,
    refreshing,
    refetch,
  } = useDashboard();

  const [scheduleTarget, setScheduleTarget] = useState(null);

  const firstName = useMemo(
    () => (user?.username?.trim() || "Broker").split(/\s+/)[0],
    [user?.username],
  );

  const stats = [
    { label: "Open Pool", value: counts?.pool ?? live?.poolCount ?? 0, to: "/pool" },
    { label: "To Schedule", value: counts?.claimed ?? 0, to: "/visits?tab=claimed" },
    { label: "Scheduled", value: counts?.scheduled ?? 0, to: "/visits?tab=scheduled" },
    { label: "Completed", value: counts?.completed ?? 0, to: "/visits?tab=closed" },
  ];

  return (
    <div className="space-y-8 py-2">
      {/* Minimal Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Hi, {firstName}
        </h1>
        <button
          type="button"
          onClick={() => {
            refetch();
            live?.refreshAll?.();
          }}
          aria-label="Refresh"
          className="inline-flex size-9 items-center justify-center rounded-full border border-border hover:bg-accent"
        >
          <RefreshCw
            className={`size-4 ${refreshing ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Compact 4-Stat Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            to={s.to}
            className="flex flex-col gap-1 rounded-2xl border border-border p-4 transition-colors hover:bg-secondary/40"
          >
            <span className="text-2xl font-bold tabular-nums text-foreground">
              {loading ? "—" : s.value}
            </span>
            <span className="text-xs text-muted-foreground">{s.label}</span>
          </Link>
        ))}
      </div>

      {/* Claimed Visits Needing Schedule */}
      {needsScheduling?.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground">
            Needs scheduling ({needsScheduling.length})
          </h2>
          <div className="space-y-2.5">
            {needsScheduling.map((v) => (
              <VisitCard
                key={v._id}
                visit={v}
                actions={
                  <Button
                    size="sm"
                    onClick={() => setScheduleTarget(v)}
                    className="rounded-full px-4"
                  >
                    Schedule
                  </Button>
                }
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* Upcoming 7-Day Agenda */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">Upcoming visits</h2>
          <Link
            to="/calendar"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            Calendar
          </Link>
        </div>

        {loading ? (
          <div className="space-y-2.5">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : upcoming?.length > 0 ? (
          <div className="space-y-2.5">
            {upcoming.map((v) => (
              <VisitCard key={v._id} visit={v} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={CalendarCheck}
            title="No upcoming visits"
            action={
              <Button asChild variant="outline" size="sm" className="rounded-full px-5">
                <Link to="/pool">Browse pool</Link>
              </Button>
            }
          />
        )}
      </section>

      <ScheduleMeetSheet
        open={Boolean(scheduleTarget)}
        onOpenChange={(open) => {
          if (!open) setScheduleTarget(null);
        }}
        visit={scheduleTarget}
        onScheduled={() => {
          setScheduleTarget(null);
          refetch();
          live?.refreshAll?.();
        }}
      />
    </div>
  );
}
