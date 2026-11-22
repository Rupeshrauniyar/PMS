import React, { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  RefreshCw,
  CalendarClock,
  CalendarCheck,
  Archive,
  ListFilter,
  MapPin,
  Download,
  ClipboardCheck,
  Inbox,
} from "lucide-react";

import { useMyVisits } from "@/hooks/useVisits";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { buildMapsUrl, downloadIcs } from "@/lib/visit";
import { Tabs } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { VisitCard } from "@/components/broker/VisitCard";
import { ScheduleMeetSheet } from "@/components/broker/ScheduleMeetSheet";

const TAB_ITEMS = [
  { value: "claimed", label: "Needs Scheduling", icon: CalendarClock },
  { value: "scheduled", label: "Scheduled", icon: CalendarCheck },
  { value: "closed", label: "Completed & Past", icon: Archive },
  { value: "all", label: "All", icon: ListFilter },
];

const VALID_TABS = new Set(TAB_ITEMS.map((t) => t.value));

export default function MyVisits() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab") || "claimed";
  const activeTab = VALID_TABS.has(rawTab) ? rawTab : "claimed";

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 200);
  const [scheduleTarget, setScheduleTarget] = useState(null);
  const { toast } = useToast();

  const { visits, loading, refreshing, error, refetch } = useMyVisits({
    status: activeTab,
  });

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return visits;
    return visits.filter((v) => {
      const title = v.property?.title?.toLowerCase() || "";
      const loc = v.property?.location?.toLowerCase() || "";
      const buyer = v.buyer?.username?.toLowerCase() || "";
      const owner = v.owner?.username?.toLowerCase() || "";
      const meet = v.schedule?.meetingPoint?.toLowerCase() || "";
      return (
        title.includes(q) ||
        loc.includes(q) ||
        buyer.includes(q) ||
        owner.includes(q) ||
        meet.includes(q)
      );
    });
  }, [visits, debouncedQuery]);

  const handleTabChange = (next) => {
    const p = new URLSearchParams(searchParams);
    p.set("tab", next);
    setSearchParams(p, { replace: true });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            My Visits
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage every site visit you have claimed, scheduled, or completed.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            loading={refreshing}
            aria-label="Refresh my visits"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            <span>Refresh</span>
          </Button>
          <Button variant="brand" size="sm" asChild>
            <Link to="/pool">
              <Inbox className="size-4" aria-hidden="true" />
              <span>Open Pool</span>
            </Link>
          </Button>
        </div>
      </header>

      {/* Tabs + Search toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          items={TAB_ITEMS}
        />

        <div className="relative w-full lg:max-w-xs">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by property, location, buyer..."
            aria-label="Filter visits by property title or location"
            className="pl-10"
          />
        </div>
      </div>

      {/* Results */}
      {error ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Couldn't load your visits"
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
          icon={ClipboardCheck}
          title={
            query.trim()
              ? "No visits match your search"
              : activeTab === "claimed"
                ? "No visits waiting to be scheduled"
                : activeTab === "scheduled"
                  ? "No upcoming scheduled visits"
                  : activeTab === "closed"
                    ? "No completed or past visits yet"
                    : "You haven't claimed any visits yet"
          }
          description={
            query.trim()
              ? "Try clearing your search term or switching to another status tab."
              : "Browse the Open Pool to claim owner-approved property visit requests."
          }
          action={
            query.trim() ? (
              <Button variant="outline" size="sm" onClick={() => setQuery("")}>
                Clear search
              </Button>
            ) : (
              <Button variant="brand" size="sm" asChild>
                <Link to="/pool">Go to Open Pool</Link>
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-3.5">
          {filtered.map((visit) => (
            <VisitCard
              key={visit._id}
              visit={visit}
              actions={
                <>
                  {visit.visitStatus === "claimed" ? (
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
                  ) : visit.visitStatus === "scheduled" ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (downloadIcs(visit)) {
                            toast({ title: "Calendar (.ics) file downloaded" });
                          }
                        }}
                      >
                        <Download className="size-4" aria-hidden="true" />
                        <span>.ics</span>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={buildMapsUrl(
                            visit.schedule?.meetingPoint || visit.property?.location,
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MapPin className="size-4" aria-hidden="true" />
                          <span>Maps</span>
                        </a>
                      </Button>
                      <Button variant="default" size="sm" asChild>
                        <Link to={`/visits/${visit._id}`}>Manage</Link>
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/visits/${visit._id}`}>View Details</Link>
                    </Button>
                  )}
                </>
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
