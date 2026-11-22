import React, { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Layers, RefreshCw, Search } from "lucide-react";

import { useApp } from "@/contexts/AppContext";
import { useAllVisits, useBrokers } from "@/hooks/useVisits";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Tabs } from "@/components/ui/tabs";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { VisitCard } from "@/components/broker/VisitCard";
import { ReassignBrokerSheet } from "@/components/broker/ReassignBrokerSheet";

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "claimed", label: "Claimed" },
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No-show" },
];

export default function AllVisits() {
  const { user, loading: authLoading, isSuperbroker } = useApp();
  const [statusTab, setStatusTab] = useState("all");
  const [brokerFilter, setBrokerFilter] = useState("all");
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 200);
  const [reassignTarget, setReassignTarget] = useState(null);

  const { visits, loading, refreshing, error, refetch } = useAllVisits(
    statusTab === "all" ? {} : { status: statusTab },
    { enabled: Boolean(user && isSuperbroker) },
  );

  const { brokers } = useBrokers({ enabled: Boolean(user && isSuperbroker) });

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return visits.filter((v) => {
      if (brokerFilter === "unassigned" && v.broker?._id) return false;
      if (
        brokerFilter !== "all" &&
        brokerFilter !== "unassigned" &&
        v.broker?._id !== brokerFilter
      ) {
        return false;
      }
      if (!q) return true;
      const hay = [
        v.property?.title,
        v.property?.location,
        v.broker?.username,
        v.buyer?.username,
        v.owner?.username,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [visits, brokerFilter, debouncedQuery]);

  if (!authLoading && (!user || !isSuperbroker)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6 py-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            All Visits
          </h1>
          {!loading ? (
            <span className="text-sm font-medium text-muted-foreground tabular-nums">
              {filtered.length}
            </span>
          ) : null}
        </div>

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

      <div className="space-y-3">
        <Tabs value={statusTab} onValueChange={setStatusTab} items={STATUS_TABS} />

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12">
          <div className="relative sm:col-span-7">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search property, broker, buyer..."
              aria-label="Search visits"
              className="pl-10"
            />
          </div>

          <div className="sm:col-span-5">
            <Select
              value={brokerFilter}
              onChange={(e) => setBrokerFilter(e.target.value)}
              aria-label="Filter by broker"
            >
              <option value="all">All Brokers ({visits.length})</option>
              <option value="unassigned">Unassigned</option>
              {brokers.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.username} ({b.assigned ?? 0})
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {error ? (
        <EmptyState
          icon={Layers}
          title="Could not load visits"
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
          icon={Layers}
          title="No matching visits"
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStatusTab("all");
                setBrokerFilter("all");
                setQuery("");
              }}
            >
              Reset
            </Button>
          }
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((visit) => {
            const canReassign = ["owner_approved", "claimed", "scheduled"].includes(
              visit.visitStatus,
            );
            return (
              <VisitCard
                key={visit._id}
                visit={visit}
                showBroker
                actions={
                  canReassign ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReassignTarget(visit)}
                      className="rounded-full"
                    >
                      Reassign
                    </Button>
                  ) : null
                }
              />
            );
          })}
        </div>
      )}

      <ReassignBrokerSheet
        open={Boolean(reassignTarget)}
        onOpenChange={(v) => {
          if (!v) setReassignTarget(null);
        }}
        visit={reassignTarget}
        onReassigned={() => {
          setReassignTarget(null);
          refetch();
        }}
      />
    </div>
  );
}
