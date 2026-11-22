import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CalendarCheck, Building2, ChevronRight } from "lucide-react";

import { approveVisit, listMyVisits, rejectVisit } from "../../api/visits";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/dialog";
import { VisitStatusPill } from "@/components/ui/visit-status";
import { useToast } from "@/components/ui/toast";
import { formatVisitDate } from "@/lib/visit";

const Visits = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [role, setRole] = useState(
    searchParams.get("role") === "owner" ? "owner" : "buyer",
  );

  const [buyerVisits, setBuyerVisits] = useState([]);
  const [ownerVisits, setOwnerVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const { toast } = useToast();

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, oRes] = await Promise.allSettled([
        listMyVisits({ role: "buyer", status: "all" }),
        listMyVisits({ role: "owner", status: "all" }),
      ]);
      setBuyerVisits(bRes.status === "fulfilled" ? bRes.value?.visits || [] : []);
      setOwnerVisits(oRes.status === "fulfilled" ? oRes.value?.visits || [] : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const pendingOwnerCount = useMemo(
    () => ownerVisits.filter((v) => v.visitStatus === "requested").length,
    [ownerVisits],
  );

  const list = role === "owner" ? ownerVisits : buyerVisits;

  const handleApprove = async (e, visitId) => {
    e.preventDefault();
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
      toast({ title: "Visit approved", variant: "success" });
    } catch (err) {
      toast({
        title: err.response?.data?.message || "Could not approve",
        variant: "error",
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectTarget) return;
    const data = await rejectVisit(rejectTarget._id, {});
    if (data?.visit) {
      setOwnerVisits((prev) =>
        prev.map((v) => (v._id === rejectTarget._id ? data.visit : v)),
      );
    } else {
      await loadAll();
    }
    setRejectTarget(null);
    toast({ title: "Visit declined" });
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 py-5 sm:py-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Visits
        </h1>
        <Tabs
          value={role}
          onValueChange={(next) => {
            setRole(next);
            setSearchParams(next === "owner" ? { role: "owner" } : {}, {
              replace: true,
            });
          }}
          items={[
            { value: "buyer", label: "Requested", count: buyerVisits.length || undefined },
            { value: "owner", label: "Incoming", count: pendingOwnerCount || undefined },
          ]}
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title={role === "owner" ? "No incoming visit requests" : "No visits requested yet"}
          action={
            role === "buyer" ? (
              <Button asChild variant="outline" size="sm" className="rounded-full px-5">
                <Link to="/">Browse properties</Link>
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="divide-y divide-border/70 rounded-2xl border border-border/80">
          {list.map((v) => {
            const prop = v.property || {};
            const thumb = prop.images?.[0] || prop.video?.thumbnail || "";
            const when = v.schedule?.startAt
              ? formatVisitDate(v.schedule.startAt)
              : v.preferredSlots?.[0]
                ? `Preferred: ${formatVisitDate(v.preferredSlots[0], { withWeekday: false })}`
                : "Awaiting schedule";

            return (
              <div
                key={v._id}
                className="flex flex-col gap-3 p-4 transition-colors hover:bg-secondary/30 sm:flex-row sm:items-center sm:justify-between"
              >
                <Link
                  to={`/visits/${v._id}`}
                  className="flex min-w-0 flex-1 items-center gap-3.5"
                >
                  <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {thumb ? (
                      <img src={thumb} alt="" className="size-full object-cover" />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground">
                        <Building2 className="size-5 opacity-40" aria-hidden="true" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[15px] font-semibold text-foreground">
                        {prop.title || "Property"}
                      </p>
                      <VisitStatusPill status={v.visitStatus} />
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {when}
                      {v.broker?.username ? ` · Broker: ${v.broker.username}` : ""}
                    </p>
                  </div>
                </Link>

                {role === "owner" && v.visitStatus === "requested" ? (
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      size="sm"
                      loading={busyId === v._id}
                      onClick={(e) => handleApprove(e, v._id)}
                      className="rounded-full px-4"
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === v._id}
                      onClick={() => setRejectTarget(v)}
                      className="rounded-full px-3.5"
                    >
                      Decline
                    </Button>
                  </div>
                ) : (
                  <Link
                    to={`/visits/${v._id}`}
                    aria-label="Open visit"
                    className="hidden shrink-0 text-muted-foreground sm:inline-flex"
                  >
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(rejectTarget)}
        onOpenChange={(v) => {
          if (!v) setRejectTarget(null);
        }}
        title="Decline visit request?"
        confirmLabel="Decline"
        destructive
        onConfirm={handleConfirmReject}
      />
    </div>
  );
};

export default Visits;
