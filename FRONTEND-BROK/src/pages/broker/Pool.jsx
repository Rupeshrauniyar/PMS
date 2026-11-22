import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Inbox,
  RefreshCw,
  MapPin,
  Clock,
  Film,
  BedDouble,
  Bath,
  Maximize2,
  Building2,
  Hand,
  MessageSquareQuote,
  Sparkles,
  Lock,
} from "lucide-react";

import { usePool } from "@/hooks/useVisits";
import { useLive } from "@/contexts/LiveContext";
import { formatPrice, timeAgo } from "@/lib/format";
import { formatVisitDate } from "@/lib/visit";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";

function firstNameOf(name) {
  if (!name) return "Buyer";
  return String(name).trim().split(/\s+/)[0] || "Buyer";
}

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
    error,
    claiming,
    claim,
    loadMore,
    refetch,
  } = usePool();

  useEffect(() => {
    if (!loading) {
      live?.setPoolCount?.(total);
    }
  }, [total, loading, live]);

  const handleClaim = async (visit) => {
    const res = await claim(visit._id);
    if (res.ok) {
      live?.setPoolCount?.((c) => Math.max(0, (c ?? 1) - 1));
      toast({
        variant: "success",
        title: "Visit claimed! Schedule the 3-way meet now.",
        description: visit?.property?.title || undefined,
      });
      navigate(`/visits/${visit._id}?schedule=1`);
      return;
    }

    if (res.conflict) {
      live?.setPoolCount?.((c) => Math.max(0, (c ?? 1) - 1));
      toast({
        variant: "error",
        title: "Another broker claimed this visit first",
        description: "The pool has been updated.",
      });
      return;
    }

    toast({
      variant: "error",
      title: "Couldn't claim visit",
      description: res.message,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Open Request Pool
            </h1>
            {!loading ? (
              <Badge variant={total > 0 ? "brand" : "secondary"}>
                {total} {total === 1 ? "request" : "requests"}
              </Badge>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            Owner-approved site visits ordered oldest-waiting first. Claim a request to unlock buyer &amp; owner contacts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="hidden items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground sm:inline-flex">
            <span className="size-2 rounded-full bg-success animate-pulse" aria-hidden="true" />
            <span>Auto-refresh · 30s</span>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            loading={refreshing}
            aria-label="Refresh open pool"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            <span>Refresh</span>
          </Button>
        </div>
      </header>

      {error ? (
        <EmptyState
          icon={Inbox}
          title="Couldn't load the open pool"
          description={error.message}
          action={
            <Button variant="outline" size="sm" onClick={refetch}>
              Retry
            </Button>
          }
        />
      ) : loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((k) => (
            <Skeleton key={k} className="h-96 rounded-3xl" />
          ))}
        </div>
      ) : visits.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="The open pool is clear!"
          description="Every owner-approved visit request has been claimed. New requests will appear here automatically every 30 seconds."
          action={
            <Button variant="outline" size="sm" onClick={refetch} loading={refreshing}>
              <RefreshCw className="size-4" aria-hidden="true" />
              <span>Check now</span>
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visits.map((visit) => {
              const prop = visit.property || {};
              const cover = prop.images?.[0] || prop.video?.thumbnail || "";
              const hasVideo = Boolean(prop.video?.url);
              const isClaiming = Boolean(claiming[visit._id]);
              const waitingSince = timeAgo(visit.updatedAt || visit.createdAt);
              const preferred = visit.preferredSlots || [];

              return (
                <article
                  key={visit._id}
                  className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-card text-card-foreground shadow-soft transition-all hover:shadow-card"
                >
                  <div>
                    {/* Cover Media */}
                    <Link
                      to={`/visits/${visit._id}`}
                      className="relative block aspect-[16/10] w-full overflow-hidden bg-muted"
                    >
                      {cover ? (
                        <img
                          src={cover}
                          alt={prop.title || "Property"}
                          width={640}
                          height={400}
                          loading="lazy"
                          className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex size-full flex-col items-center justify-center gap-1.5 text-muted-foreground">
                          <Building2 className="size-8 opacity-55" aria-hidden="true" />
                          <span className="text-xs font-medium">No cover photo</span>
                        </div>
                      )}

                      <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {hasVideo ? (
                            <Badge variant="glass" className="gap-1">
                              <Film className="size-3.5 text-brand" aria-hidden="true" />
                              <span>Video tour</span>
                            </Badge>
                          ) : null}
                          {prop.sellingType ? (
                            <Badge variant="glass">
                              {prop.sellingType === "Rent System" ? "For Rent" : "For Sale"}
                            </Badge>
                          ) : null}
                        </div>

                        {waitingSince ? (
                          <Badge variant="warning" className="shadow-soft">
                            <Clock className="size-3" aria-hidden="true" />
                            <span>Waiting {waitingSince}</span>
                          </Badge>
                        ) : null}
                      </div>

                      <div className="absolute bottom-3 left-3">
                        <span className="inline-flex items-center rounded-xl bg-black/65 px-2.5 py-1 text-xs font-extrabold text-white backdrop-blur-md">
                          {formatPrice(prop.price ?? visit.price)}
                        </span>
                      </div>
                    </Link>

                    {/* Body */}
                    <div className="space-y-3.5 p-4 sm:p-5">
                      <div>
                        <Link
                          to={`/visits/${visit._id}`}
                          className="line-clamp-1 text-base font-bold tracking-tight text-foreground hover:text-brand"
                        >
                          {prop.title || "Property Request"}
                        </Link>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                          <span className="line-clamp-1">
                            {prop.location || "Location available inside"}
                          </span>
                        </p>
                      </div>

                      {/* Specs */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {prop.propertyType ? (
                          <span className="rounded-md bg-muted px-2 py-0.5 font-semibold text-foreground/85">
                            {prop.propertyType}
                          </span>
                        ) : null}
                        {prop.rooms ? (
                          <span className="inline-flex items-center gap-1">
                            <BedDouble className="size-3.5" aria-hidden="true" />
                            {prop.rooms} rooms
                          </span>
                        ) : null}
                        {prop.washrooms ? (
                          <span className="inline-flex items-center gap-1">
                            <Bath className="size-3.5" aria-hidden="true" />
                            {prop.washrooms} baths
                          </span>
                        ) : null}
                        {prop.area ? (
                          <span className="inline-flex items-center gap-1">
                            <Maximize2 className="size-3.5" aria-hidden="true" />
                            {prop.area}
                          </span>
                        ) : null}
                      </div>

                      {/* Buyer preview */}
                      <div className="flex items-center justify-between gap-2 rounded-2xl border border-border/70 bg-muted/40 px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar
                            src={visit.buyer?.pp}
                            name={firstNameOf(visit.buyer?.username)}
                            size="xs"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-foreground">
                              {firstNameOf(visit.buyer?.username)}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              Verified buyer · Owner approved
                            </p>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                          <Lock className="size-3" aria-hidden="true" />
                          <span>Claim for phone</span>
                        </span>
                      </div>

                      {/* Preferred Slots */}
                      {preferred.length > 0 ? (
                        <div className="space-y-1.5">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Preferred Time Slots
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {preferred.slice(0, 3).map((slot, idx) => (
                              <span
                                key={`${slot}-${idx}`}
                                className="rounded-lg border border-brand/25 bg-brand-soft/50 px-2.5 py-1 text-xs font-semibold text-foreground"
                              >
                                {formatVisitDate(slot)}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {/* Buyer Note Preview */}
                      {visit.note ? (
                        <p className="flex items-start gap-1.5 rounded-xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                          <MessageSquareQuote
                            className="mt-0.5 size-3.5 shrink-0 text-brand"
                            aria-hidden="true"
                          />
                          <span className="line-clamp-2 italic">&ldquo;{visit.note}&rdquo;</span>
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center gap-2 border-t border-border/65 bg-muted/25 px-4 py-3 sm:px-5">
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link to={`/visits/${visit._id}`}>Inspect</Link>
                    </Button>
                    <Button
                      variant="brand"
                      size="sm"
                      loading={isClaiming}
                      onClick={() => handleClaim(visit)}
                      className="flex-[1.4]"
                    >
                      <Hand className="size-4" aria-hidden="true" />
                      <span>Claim Visit</span>
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Pagination */}
          {hasMore ? (
            <div className="flex flex-col items-center gap-2 pt-2">
              <p className="text-xs text-muted-foreground">
                Showing {visits.length} of {total} open requests
              </p>
              <Button
                variant="outline"
                onClick={loadMore}
                loading={loadingMore}
              >
                Load more requests
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
