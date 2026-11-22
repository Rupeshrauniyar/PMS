import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Inbox, RefreshCw, Play, Building2 } from "lucide-react";

import { usePool } from "@/hooks/useVisits";
import { useLive } from "@/contexts/LiveContext";
import { formatPrice, timeAgo } from "@/lib/format";
import { formatVisitDate } from "@/lib/visit";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";

export default function Pool() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const live = useLive();

  const {
    visits,
    total,
    hasMore,
    loading,
    loadingMore,
    refreshing,
    claiming,
    claim,
    loadMore,
    refetch,
  } = usePool();

  useEffect(() => {
    if (!loading) live?.setPoolCount?.(total);
  }, [total, loading, live]);

  const handleClaim = async (visit) => {
    const res = await claim(visit._id);
    if (res.ok) {
      live?.setPoolCount?.((c) => Math.max(0, (c ?? 1) - 1));
      toast({ title: "Visit claimed", variant: "success" });
      navigate(`/visits/${visit._id}?schedule=1`);
      return;
    }
    if (res.conflict) {
      live?.setPoolCount?.((c) => Math.max(0, (c ?? 1) - 1));
      toast({ title: "Already claimed by another broker", variant: "error" });
      return;
    }
    toast({ title: res.message || "Could not claim", variant: "error" });
  };

  return (
    <div className="space-y-6 py-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Open Pool
          </h1>
          {!loading ? (
            <span className="text-sm font-medium text-muted-foreground tabular-nums">
              {total}
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={refetch}
          aria-label="Refresh pool"
          className="inline-flex size-9 items-center justify-center rounded-full border border-border hover:bg-accent"
        >
          <RefreshCw
            className={`size-4 ${refreshing ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((k) => (
            <Skeleton key={k} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : visits.length === 0 ? (
        <EmptyState icon={Inbox} title="No unclaimed requests" />
      ) : (
        <>
          <div className="divide-y divide-border/70 rounded-2xl border border-border">
            {visits.map((visit) => {
              const prop = visit.property || {};
              const cover = prop.images?.[0] || prop.video?.thumbnail || "";
              const hasVideo = Boolean(prop.video?.url);
              const isClaiming = Boolean(claiming[visit._id]);
              const slotText = visit.preferredSlots?.[0]
                ? formatVisitDate(visit.preferredSlots[0], { withWeekday: false })
                : "Flexible time";

              return (
                <div
                  key={visit._id}
                  className="flex flex-col gap-3 p-4 transition-colors hover:bg-secondary/30 sm:flex-row sm:items-center sm:justify-between"
                >
                  <Link
                    to={`/visits/${visit._id}`}
                    className="flex min-w-0 flex-1 items-center gap-3.5"
                  >
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                      {cover ? (
                        <img src={cover} alt="" className="size-full object-cover" />
                      ) : (
                        <div className="flex size-full items-center justify-center text-muted-foreground">
                          <Building2 className="size-5 opacity-40" aria-hidden="true" />
                        </div>
                      )}
                      {hasVideo ? (
                        <span className="absolute bottom-1 left-1 flex size-5 items-center justify-center rounded-full bg-black/70 text-white">
                          <Play className="ml-0.5 size-2.5 fill-current" aria-hidden="true" />
                        </span>
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="truncate text-[15px] font-semibold text-foreground">
                        {prop.title || "Property"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {prop.location} · {formatPrice(prop.price ?? visit.price)}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {slotText} · {timeAgo(visit.updatedAt || visit.createdAt)}
                      </p>
                    </div>
                  </Link>

                  <Button
                    size="sm"
                    loading={isClaiming}
                    onClick={() => handleClaim(visit)}
                    className="shrink-0 rounded-full px-5"
                  >
                    Claim
                  </Button>
                </div>
              );
            })}
          </div>

          {hasMore ? (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                loading={loadingMore}
                onClick={loadMore}
                className="rounded-full px-5"
              >
                Load more
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
