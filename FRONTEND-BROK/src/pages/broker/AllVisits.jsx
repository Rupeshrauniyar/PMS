import React, { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  Layers,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";

import { useApp } from "@/contexts/AppContext";
import { useAllVisits, useBrokers } from "@/hooks/useVisits";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Tabs } from "@/components/ui/tabs";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              All Broker Visits
            </h1>
            <Badge variant="brand">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              <span>Superbroker Oversight</span>
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Organization-wide view across every broker, buyer, and property owner — filter and reassign live.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={refetch}
          loading={refreshing}
          aria-label="Refresh all visits"
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          <span>Refresh</span>
        </Button>
      </header>

      {/* Filters */}
      <div className="space-y-3">
        <Tabs
          value={statusTab}
          onValueChange={setStatusTab}
          items={STATUS_TABS}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
          <div className="relative sm:col-span-7">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search broker name, property title, location, buyer..."
              aria-label="Search visits by broker or property"
              className="pl-10"
            />
          </div>

          <div className="sm:col-span-5">
            <Select
              value={brokerFilter}
              onChange={(e) => setBrokerFilter(e.target.value)}
              aria-label="Filter by assigned broker"
            >
              <option value="all">All Brokers ({visits.length})</option>
              <option value="unassigned">Unassigned (Open Pool)</option>
              {brokers.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.username} {b.role === "superbroker" ? "(Superbroker)" : ""} — {b.assigned ?? 0} active
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* Results */}
      {error ? (
        <EmptyState
          icon={Layers}
          title="Couldn't load organization visits"
          description={error.message}
          action={
            <Button variant="outline" size="sm" onClick={refetch}>
              Retry
            </Button>
          }
        />
      ) : loading ? (
        <div className="space-y-3.5">
          {[1, 2, 3].map((k) => (
            <Skeleton key={k} className="h-48 w-full rounded-3xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No visits match your filters"
          description="Try broadening the status tab, broker selector, or search query."
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
              Reset filters
            </Button>
          }
        />
      ) : (
        <div className="space-y-3.5">
          <p className="text-xs font-medium text-muted-foreground">
            Showing {filtered.length} {filtered.length === 1 ? "visit" : "visits"}
          </p>
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
                  <>
                    {canReassign ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReassignTarget(visit)}
                      >
                        <ShieldCheck className="size-4 text-brand" aria-hidden="true" />
                        <span>Reassign</span>
                      </Button>
                    ) : null}
                    <Button variant="default" size="sm" asChild>
                      <Link to={`/visits/${visit._id}`}>Inspect</Link>
                    </Button>
                  </>
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
