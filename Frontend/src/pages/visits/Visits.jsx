import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  CalendarCheck,
  Building2,
  MapPin,
  Film,
  Clock,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  XCircle,
  Search,
} from "lucide-react";

import { approveVisit, listMyVisits, rejectVisit } from "../../api/visits";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Textarea, Field } from "@/components/ui/input";
import { VisitStatusPill } from "@/components/ui/visit-status";
import { useToast } from "@/components/ui/toast";
import { formatPrice, timeAgo } from "@/lib/format";
import {
  formatVisitDate,
  formatVisitTimeRange,
  isOpenVisitStatus,
} from "@/lib/visit";
import { cn } from "@/lib/utils";

const SUB_FILTERS = [
  { value: "open", label: "Open" },
  { value: "past", label: "Past" },
  { value: "all", label: "All" },
];

function VisitCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-card p-4 shadow-soft sm:flex-row">
      <Skeleton className="aspect-[4/3] w-full rounded-2xl sm:h-32 sm:w-44 sm:aspect-auto shrink-0" />
      <div className="flex flex-1 flex-col justify-between gap-3">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-5 w-32 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-9 w-36 rounded-xl" />
      </div>
    </div>
  );
}

const Visits = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRole = searchParams.get("role") === "owner" ? "owner" : "buyer";

  const [role, setRole] = useState(initialRole);
  const [subFilter, setSubFilter] = useState("open");

  const [buyerVisits, setBuyerVisits] = useState([]);
  const [ownerVisits, setOwnerVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  const [busyId, setBusyId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectNote, setRejectNote] = useState("");
  const { toast } = useToast();

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, oRes] = await Promise.allSettled([
        listMyVisits({ role: "buyer", status: "all" }),
        listMyVisits({ role: "owner", status: "all" }),
      ]);
      setBuyerVisits(
        bRes.status === "fulfilled" ? bRes.value?.visits || [] : [],
      );
      setOwnerVisits(
        oRes.status === "fulfilled" ? oRes.value?.visits || [] : [],
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleRoleChange = (nextRole) => {
    setRole(nextRole);
    setSearchParams(nextRole === "owner" ? { role: "owner" } : {}, {
      replace: true,
    });
  };

  const pendingOwnerCount = useMemo(
    () => ownerVisits.filter((v) => v.visitStatus === "requested").length,
    [ownerVisits],
  );

  const activeList = role === "owner" ? ownerVisits : buyerVisits;

  const filteredList = useMemo(() => {
    if (subFilter === "open") {
      return activeList.filter((v) => isOpenVisitStatus(v.visitStatus));
    }
    if (subFilter === "past") {
      return activeList.filter((v) => !isOpenVisitStatus(v.visitStatus));
    }
    return activeList;
  }, [activeList, subFilter]);

  const handleApprove = async (visitId) => {
    try {
      setBusyId(visitId);
      const data = await approveVisit(visitId);
      if (data?.visit) {
        setOwnerVisits((prev) =>
          prev.map((v) => (v._id === visitId ? data.visit : v)),
        );
      } else {
        await loadAll();
      }
      toast({
        title: "Visit approved!",
        description: "Open in the broker pool for scheduling.",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Could not approve visit",
        description: err.response?.data?.message || "Please try again.",
        variant: "error",
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectTarget) return;
    try {
      const data = await rejectVisit(rejectTarget._id, {
        note: rejectNote.trim(),
      });
      if (data?.visit) {
        setOwnerVisits((prev) =>
          prev.map((v) => (v._id === rejectTarget._id ? data.visit : v)),
        );
      } else {
        await loadAll();
      }
      setRejectNote("");
      setRejectTarget(null);
      toast({
        title: "Visit declined",
        description: "The buyer has been notified.",
      });
    } catch (err) {
      toast({
        title: "Could not decline visit",
        description: err.response?.data?.message || "Please try again.",
        variant: "error",
      });
      throw err;
    }
  };

  const roleTabs = [
    {
      value: "buyer",
      label: "My visit requests",
      icon: CalendarCheck,
      count: buyerVisits.filter((v) => isOpenVisitStatus(v.visitStatus)).length || undefined,
    },
    {
      value: "owner",
      label: "Visits to my listings",
      icon: Building2,
      count: pendingOwnerCount > 0 ? pendingOwnerCount : undefined,
    },
  ];

  return (
    <div className="flex flex-col gap-6 py-5 sm:py-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand">
          3-Party Coordination
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Site Visits
        </h1>
        <p className="text-sm text-muted-foreground">
          Track buyer requests, owner approvals, assigned brokers, and confirmed schedules.
        </p>
      </div>

      {/* Role Tabs + Status Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={role}
          onValueChange={handleRoleChange}
          items={roleTabs}
        />

        <div className="flex items-center gap-1.5">
          {SUB_FILTERS.map((sf) => {
            const active = subFilter === sf.value;
            return (
              <button
                key={sf.value}
                type="button"
                onClick={() => setSubFilter(sf.value)}
                className={cn(
                  "inline-flex h-8 items-center rounded-full border px-3.5 text-xs font-semibold transition-colors",
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {sf.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <VisitCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredList.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title={
            subFilter === "open"
              ? role === "buyer"
                ? "No open visit requests"
                : "No open visits on your listings"
              : "No visits in this view"
          }
          description={
            role === "buyer"
              ? "Open any property listing and tap 'Request site visit' to pick your preferred date and time slots."
              : "Incoming site visit requests on your properties will appear here for approval."
          }
          action={
            subFilter !== "all" && activeList.length > 0 ? (
              <Button variant="outline" size="sm" onClick={() => setSubFilter("all")}>
                View all ({activeList.length})
              </Button>
            ) : role === "buyer" ? (
              <Button asChild variant="brand" size="sm">
                <Link to="/search">
                  <Search className="size-4" aria-hidden="true" />
                  <span>Explore properties</span>
                </Link>
              </Button>
            ) : (
              <Button asChild variant="brand" size="sm">
                <Link to="/add-property">List a property</Link>
              </Button>
            )
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {filteredList.map((visit) => {
            const prop = visit.property || {};
            const thumb = prop.images?.[0] || prop.video?.thumbnail || "";
            const hasVideo = Boolean(prop.video?.url);
            const isOwnerPending =
              role === "owner" && visit.visitStatus === "requested";
            const isScheduled = visit.visitStatus === "scheduled";

            return (
              <article
                key={visit._id}
                className="group flex flex-col gap-4 rounded-3xl border border-border/75 bg-card p-4 shadow-soft transition-[border-color,box-shadow] hover:border-foreground/20 hover:shadow-card sm:flex-row sm:items-stretch"
              >
                {/* Property Thumbnail */}
                <Link
                  to={`/visits/${visit._id}`}
                  className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-2xl bg-muted sm:aspect-auto sm:w-48"
                >
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={prop.title || "Property"}
                      width={384}
                      height={288}
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-muted-foreground">
                      <Building2 className="size-7 opacity-50" aria-hidden="true" />
                    </div>
                  )}
                  {hasVideo ? (
                    <Badge
                      variant="glass"
                      className="absolute left-2.5 top-2.5 gap-1 px-2 py-0.5 text-[10px]"
                    >
                      <Film className="size-3 text-brand" aria-hidden="true" />
                      <span>Video</span>
                    </Badge>
                  ) : null}
                </Link>

                {/* Visit Details */}
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <VisitStatusPill status={visit.visitStatus} />
                      <span className="text-xs text-muted-foreground">
                        {timeAgo(visit.updatedAt || visit.createdAt)}
                      </span>
                    </div>

                    <Link
                      to={`/visits/${visit._id}`}
                      className="mt-0.5 line-clamp-1 text-base font-bold text-foreground hover:text-brand transition-colors"
                    >
                      {prop.title || "Property Visit"}
                    </Link>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {prop.price ? (
                        <span className="font-bold text-foreground tabular-nums">
                          {formatPrice(prop.price)}
                          {prop.sellingType === "Rent System" ? "/mo" : ""}
                        </span>
                      ) : null}
                      {prop.location ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3.5 text-brand" aria-hidden="true" />
                          <span className="truncate">{prop.location}</span>
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Schedule or Preferred Slots */}
                  {isScheduled && visit.schedule?.startAt ? (
                    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-success/30 bg-success-soft/50 px-3 py-2 text-xs">
                      <CalendarCheck className="size-4 shrink-0 text-success" aria-hidden="true" />
                      <span className="font-bold text-foreground">
                        {formatVisitDate(visit.schedule.startAt)}
                      </span>
                      <span className="text-muted-foreground">
                        · {formatVisitTimeRange(visit.schedule.startAt, visit.schedule.durationMin)}
                      </span>
                    </div>
                  ) : Array.isArray(visit.preferredSlots) &&
                    visit.preferredSlots.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="size-3.5 shrink-0 text-brand" aria-hidden="true" />
                      <span>Preferred:</span>
                      <span className="font-medium text-foreground">
                        {formatVisitDate(visit.preferredSlots[0])}
                      </span>
                      {visit.preferredSlots.length > 1 ? (
                        <Badge variant="secondary" className="px-2 py-0 text-[10px]">
                          +{visit.preferredSlots.length - 1} more
                        </Badge>
                      ) : null}
                    </div>
                  ) : null}

                  {/* Bottom Row: Broker / Counterparty Chip + Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {role === "owner" && visit.buyer ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-foreground">
                          <Avatar
                            src={visit.buyer.pp}
                            name={visit.buyer.username}
                            size="xs"
                            className="size-5 text-[9px]"
                          />
                          <span>Buyer: {visit.buyer.username}</span>
                        </span>
                      ) : null}

                      {visit.broker ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand">
                          <UserCheck className="size-3.5" aria-hidden="true" />
                          <span>Broker: {visit.broker.username}</span>
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2">
                      {isOwnerPending ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={busyId === visit._id}
                            onClick={() => {
                              setRejectNote("");
                              setRejectTarget(visit);
                            }}
                          >
                            <XCircle className="size-4 text-destructive" aria-hidden="true" />
                            <span>Decline</span>
                          </Button>
                          <Button
                            variant="brand"
                            size="sm"
                            loading={busyId === visit._id}
                            onClick={() => handleApprove(visit._id)}
                          >
                            <CheckCircle2 className="size-4" aria-hidden="true" />
                            <span>Approve</span>
                          </Button>
                        </>
                      ) : null}

                      <Button asChild variant="ghost" size="sm">
                        <Link to={`/visits/${visit._id}`}>
                          <span>Details</span>
                          <ArrowRight className="size-3.5" aria-hidden="true" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Owner Decline ConfirmDialog */}
      <ConfirmDialog
        open={Boolean(rejectTarget)}
        onOpenChange={(open) => {
          if (!open) setRejectTarget(null);
        }}
        title="Decline visit request?"
        description="Let the buyer know if the property is unavailable or suggest re-applying."
        confirmLabel="Decline request"
        cancelLabel="Cancel"
        destructive
        onConfirm={handleConfirmReject}
      >
        <Field label="Optional note">
          <Textarea
            rows={3}
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="Reason for declining (optional)…"
          />
        </Field>
      </ConfirmDialog>
    </div>
  );
};

export default Visits;
