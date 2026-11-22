import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  CalendarPlus,
  MapPin,
  Phone,
  Mail,
  Building2,
  ChevronRight,
} from "lucide-react";

import {
  approveVisit,
  cancelVisit,
  getVisit,
  rejectVisit,
} from "../../api/visits";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { VisitStatusPill, VisitStepper } from "@/components/ui/visit-status";
import { useToast } from "@/components/ui/toast";
import { formatPrice } from "@/lib/format";
import {
  buildMapsUrl,
  downloadIcs,
  formatVisitDate,
  formatVisitTimeRange,
  isOpenVisitStatus,
} from "@/lib/visit";

function ContactItem({ role, person, fallbackText }) {
  if (!person) {
    return (
      <div className="flex items-center justify-between py-3 text-sm">
        <span className="text-muted-foreground">{role}</span>
        <span className="text-xs text-muted-foreground">{fallbackText}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar src={person.pp} name={person.username || role} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {person.username || role}
          </p>
          <p className="text-xs text-muted-foreground">{role}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {person.phone ? (
          <a
            href={`tel:${person.phone}`}
            aria-label={`Call ${person.username || role}`}
            className="inline-flex size-8 items-center justify-center rounded-full border border-border hover:bg-accent"
          >
            <Phone className="size-3.5" aria-hidden="true" />
          </a>
        ) : null}
        {person.email ? (
          <a
            href={`mailto:${person.email}`}
            aria-label={`Email ${person.username || role}`}
            className="inline-flex size-8 items-center justify-center rounded-full border border-border hover:bg-accent"
          >
            <Mail className="size-3.5" aria-hidden="true" />
          </a>
        ) : null}
      </div>
    </div>
  );
}

const VisitDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approveBusy, setApproveBusy] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const loadVisit = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getVisit(id);
      setVisit(data?.visit || null);
    } catch {
      setVisit(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadVisit();
  }, [loadVisit]);

  const handleApprove = async () => {
    try {
      setApproveBusy(true);
      const data = await approveVisit(id);
      setVisit(data?.visit || visit);
      toast({ title: "Approved — sent to brokers", variant: "success" });
    } catch (err) {
      toast({
        title: err.response?.data?.message || "Could not approve",
        variant: "error",
      });
    } finally {
      setApproveBusy(false);
    }
  };

  const handleReject = async () => {
    const data = await rejectVisit(id, {});
    setVisit(data?.visit || visit);
    toast({ title: "Visit declined" });
  };

  const handleCancel = async () => {
    const data = await cancelVisit(id, {});
    setVisit(data?.visit || visit);
    toast({ title: "Visit cancelled" });
  };

  if (loading) {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-4 py-6">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  if (!visit?._id) {
    return (
      <EmptyState
        title="Visit not found"
        action={
          <Button asChild size="sm" className="rounded-full px-5">
            <Link to="/visits">All visits</Link>
          </Button>
        }
      />
    );
  }

  const prop = visit.property || {};
  const thumb = prop.images?.[0] || prop.video?.thumbnail || "";
  const isOwner = visit.viewerRole === "owner";
  const isOpen = isOpenVisitStatus(visit.visitStatus);
  const isRequested = visit.visitStatus === "requested";
  const isScheduled =
    visit.visitStatus === "scheduled" && Boolean(visit.schedule?.startAt);
  const meetPlace = visit.schedule?.meetingPoint || prop.location || "";

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 py-4 pb-16 sm:py-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/visits")}
          aria-label="Back to visits"
          className="inline-flex size-9 items-center justify-center rounded-full border border-border hover:bg-accent"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>
        <VisitStatusPill status={visit.visitStatus} />
      </div>

      {/* Property Row */}
      {prop._id ? (
        <Link
          to={`/view/${prop._id}`}
          className="flex items-center gap-3.5 rounded-2xl border border-border p-3 transition-colors hover:bg-secondary/40"
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
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-foreground">
              {prop.title}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {prop.location} · {formatPrice(prop.price)}
            </p>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </Link>
      ) : null}

      {/* Minimal 4-Dot Stepper */}
      <VisitStepper visit={visit} />

      {/* Schedule Info */}
      {isScheduled ? (
        <div className="space-y-3 rounded-2xl border border-border p-4">
          <div>
            <p className="text-xs text-muted-foreground">Confirmed meet</p>
            <p className="mt-0.5 text-base font-bold text-foreground">
              {formatVisitDate(visit.schedule.startAt)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatVisitTimeRange(
                visit.schedule.startAt,
                visit.schedule.durationMin,
              )}
            </p>
          </div>

          {meetPlace ? (
            <p className="text-sm text-foreground">{meetPlace}</p>
          ) : null}

          {visit.schedule?.notes ? (
            <p className="text-xs text-muted-foreground">{visit.schedule.notes}</p>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => downloadIcs(visit)}
              className="rounded-full"
            >
              <CalendarPlus className="size-3.5" aria-hidden="true" />
              <span>Add to Calendar</span>
            </Button>
            {meetPlace ? (
              <Button asChild size="sm" variant="outline" className="rounded-full">
                <a
                  href={buildMapsUrl(meetPlace)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MapPin className="size-3.5" aria-hidden="true" />
                  <span>Directions</span>
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      ) : visit.preferredSlots?.length > 0 ? (
        <div className="space-y-2 rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Preferred times</p>
          <div className="flex flex-col gap-1 text-sm font-medium text-foreground">
            {visit.preferredSlots.map((slot, i) => (
              <span key={i}>{formatVisitDate(slot)}</span>
            ))}
          </div>
          {visit.note ? (
            <p className="pt-1 text-xs text-muted-foreground">“{visit.note}”</p>
          ) : null}
        </div>
      ) : null}

      {/* People */}
      <div className="divide-y divide-border/70 rounded-2xl border border-border px-4">
        <ContactItem
          role="Broker"
          person={visit.broker}
          fallbackText={
            isRequested ? "Assigned after owner approval" : "Matching a broker…"
          }
        />
        {isOwner ? (
          <ContactItem role="Buyer" person={visit.buyer} fallbackText="Buyer" />
        ) : (
          <ContactItem role="Owner" person={visit.owner} fallbackText="Owner" />
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {isOwner && isRequested ? (
          <>
            <Button
              loading={approveBusy}
              onClick={handleApprove}
              className="flex-1 rounded-full"
            >
              Approve visit
            </Button>
            <Button
              variant="outline"
              disabled={approveBusy}
              onClick={() => setRejectOpen(true)}
              className="rounded-full px-5"
            >
              Decline
            </Button>
          </>
        ) : null}

        {isOpen && !(isOwner && isRequested) ? (
          <Button
            variant="outline"
            onClick={() => setCancelOpen(true)}
            className="w-full rounded-full text-destructive hover:text-destructive"
          >
            Cancel visit
          </Button>
        ) : null}
      </div>

      <ConfirmDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Decline this visit?"
        confirmLabel="Decline"
        destructive
        onConfirm={handleReject}
      />

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel this visit?"
        confirmLabel="Cancel visit"
        destructive
        onConfirm={handleCancel}
      />
    </div>
  );
};

export default VisitDetail;
