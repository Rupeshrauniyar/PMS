import React, { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, RefreshCw, ClipboardCheck } from "lucide-react";

import { useMyVisits } from "@/hooks/useVisits";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Tabs } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { VisitCard } from "@/components/broker/VisitCard";
import { ScheduleMeetSheet } from "@/components/broker/ScheduleMeetSheet";

const TAB_ITEMS = [
  { value: "claimed", label: "To Schedule" },
  { value: "scheduled", label: "Scheduled" },
  { value: "closed", label: "Past" },
  { value: "all", label: "All" },
];

const VALID_TABS = new Set(TAB_ITEMS.map((t) => t.value));

export default function MyVisits() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab") || "claimed";
  const activeTab = VALID_TABS.has(rawTab) ? rawTab : "claimed";

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 200);
  const [scheduleTarget, setScheduleTarget] = useState(null);

  const { visits, loading, refreshing, error, refetch } = useMyVisits({
    status: activeTab,
  });

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return visits;
    return visits.filter((v) => {
      const hay = [
        v.property?.title,
        v.property?.location,
        v.buyer?.username,
        v.owner?.username,
        v.schedule?.meetingPoint,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [visits, debouncedQuery]);

  const handleTabChange = (next) => {
    const p = new URLSearchParams(searchParams);
    p.set("tab", next);
    setSearchParams(p, { replace: true });
  };

  return (
    <div className="space-y-6 py-2">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          My Visits
        </h1>

        <div className="flex items-center gap-2">
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
          <Button size="sm" asChild className="rounded-full px-4">
            <Link to="/pool">Open Pool</Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={activeTab} onValueChange={handleTabChange} items={TAB_ITEMS} />

        <div className="relative w-full sm:max-w-xs">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search visits..."
            aria-label="Search visits"
            className="pl-10"
          />
        </div>
      </div>

      {error ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Could not load visits"
          description={error.message}
          action={
            <Button variant="outline" size="sm" onClick={refetch}>
              Retry
            </Button>
          }
        />
      ) : loading ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map((k) => (
            <Skeleton key={k} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title={query.trim() ? "No matching visits" : "No visits here"}
          action={
            query.trim() ? (
              <Button variant="outline" size="sm" onClick={() => setQuery("")}>
                Clear
              </Button>
            ) : (
              <Button variant="outline" size="sm" asChild className="rounded-full px-5">
                <Link to="/pool">Browse pool</Link>
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((visit) => (
            <VisitCard
              key={visit._id}
              visit={visit}
              actions={
                visit.visitStatus === "claimed" ? (
                  <Button
                    size="sm"
                    onClick={() => setScheduleTarget(visit)}
                    className="rounded-full px-4"
                  >
                    Schedule
                  </Button>
                ) : null
              }
            />
          ))}
        </div>
      )}

      <ScheduleMeetSheet
        open={Boolean(scheduleTarget)}
        onOpenChange={(v) => {
          if (!v) setScheduleTarget(null);
        }}
        visit={scheduleTarget}
        onScheduled={() => {
          setScheduleTarget(null);
          refetch();
        }}
      />
    </div>
  );
}
