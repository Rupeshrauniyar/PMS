import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  CalendarCheck,
  CalendarPlus,
  MapPin,
  ExternalLink,
  Phone,
  Mail,
  Building2,
  Film,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  UserCheck,
  History,
  Bed,
  Bath,
  Ruler,
} from "lucide-react";

import {
  approveVisit,
  cancelVisit,
  getVisit,
  rejectVisit,
} from "../../api/visits";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Textarea, Field } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { VisitStatusPill, VisitStepper } from "@/components/ui/visit-status";
import { useToast } from "@/components/ui/toast";
import { formatPrice, timeAgo } from "@/lib/format";
import {
  buildMapsUrl,
  downloadIcs,
  formatVisitDate,
  formatVisitTimeRange,
  isOpenVisitStatus,
} from "@/lib/visit";

const TIMELINE_LABELS = {
  requested: "Visit requested by buyer",
  owner_approved: "Approved by property owner (sent to broker pool)",
  rejected: "Declined by property owner",
  claimed: "Claimed by Propatyc broker",
  released: "Released back to broker pool",
  scheduled: "In-person visit scheduled",
  rescheduled: "Visit rescheduled",
  completed: "Site visit completed",
  no_show: "Marked as no-show",
  cancelled: "Visit cancelled",
  reassigned: "Broker reassigned",
};

function PersonRow({ roleLabel, person, highlight = false, emptyNote }) {
  if (!person) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-border/80 bg-muted/25 p-3.5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <UserCheck className="size-4" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {roleLabel}
            </p>
            <p className="text-sm font-medium text-muted-foreground">
              {emptyNote || "Not assigned yet"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        highlight
          ? "flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand/35 bg-brand-soft/45 p-3.5"
          : "flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/25 p-3.5"
      }
    >
      <div className="flex min-w-0 items-center gap-3">
        <Avatar src={person.pp} name={person.username || roleLabel} size="default" />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {roleLabel}
          </p>
          <p className="truncate text-sm font-bold text-foreground">
            {person.username || roleLabel}
          </p>
          {person.phone || person.email ? (
            <p className="truncate text-xs text-muted-foreground">
              {[person.phone, person.email].filter(Boolean).join(" · ")}
            </p>
          ) : null}
        </div>
      </div>

      {person.phone || person.email ? (
        <div className="flex items-center gap-2">
          {person.phone ? (
            <Button asChild variant="outline" size="sm">
              <a href={`tel:${person.phone}`} aria-label={`Call ${person.username || roleLabel}`}>
                <Phone className="size-3.5 text-success" aria-hidden="true" />
                <span>Call</span>
              </a>
            </Button>
          ) : null}
          {person.email ? (
            <Button asChild variant="outline" size="sm">
              <a href={`mailto:${person.email}`} aria-label={`Email ${person.username || roleLabel}`}>
                <Mail className="size-3.5 text-info" aria-hidden="true" />
                <span>Email</span>
              </a>
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

const VisitDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [approveBusy, setApproveBusy] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const loadVisit = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await getVisit(id);
      setVisit(data?.visit || null);
    } catch (err) {
      setVisit(null);
      setErrorMsg(
        err.response?.status === 403
          ? "You do not have permission to view this visit."
          : err.response?.data?.message || "Visit could not be found.",
      );
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
      if (data?.visit) setVisit(data.visit);
      else await loadVisit();
      toast({
        title: "Approved for broker scheduling!",
        description:
          "A Propatyc broker will claim this visit and coordinate the in-person meet.",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Could not approve visit",
        description: err.response?.data?.message || "Please try again.",
        variant: "error",
      });
    } finally {
      setApproveBusy(false);
    }
  };

  const handleReject = async () => {
    try {
      const data = await rejectVisit(id, { note: rejectNote.trim() });
      if (data?.visit) setVisit(data.visit);
      else await loadVisit();
      setRejectNote("");
      toast({
        title: "Visit request declined",
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

  const handleCancel = async () => {
    try {
      const data = await cancelVisit(id, { reason: cancelReason.trim() });
      if (data?.visit) setVisit(data.visit);
      else await loadVisit();
      setCancelReason("");
      toast({
        title: "Site visit cancelled",
        description: "All parties involved have been notified.",
      });
    } catch (err) {
      toast({
        title: "Could not cancel visit",
        description: err.response?.data?.message || "Please try again.",
        variant: "error",
      });
      throw err;
    }
  };

  const handleDownloadIcs = () => {
    const ok = downloadIcs(visit);
    if (ok) {
      toast({
        title: "Calendar invite downloaded",
        description: "Open the .ics file to add this visit to your calendar.",
        variant: "success",
      });
    } else {
      toast({
        title: "Schedule not set yet",
        variant: "error",
      });
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-6 py-6">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-28 rounded-3xl" />
        <Skeleton className="h-48 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }

  if (!visit?._id) {
    return (
      <div className="py-12">
        <EmptyState
          icon={CalendarCheck}
          title="Visit not available"
          description={errorMsg || "We couldn't find this site visit."}
          action={
            <Button asChild variant="brand">
              <Link to="/visits">Back to My Visits</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const prop = visit.property || {};
  const thumb = prop.images?.[0] || prop.video?.thumbnail || "";
  const viewerRole = visit.viewerRole; // "buyer" | "owner"
  const isOwner = viewerRole === "owner";
  const isOpen = isOpenVisitStatus(visit.visitStatus);
  const isRequested = visit.visitStatus === "requested";
  const isScheduled =
    visit.visitStatus === "scheduled" && Boolean(visit.schedule?.startAt);

  const mapQuery = visit.schedule?.meetingPoint || prop.location || "";
  const timeline = Array.isArray(visit.timeline) ? visit.timeline : [];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 py-5 sm:py-8">
      {/* Header + Contextual Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/visits")}
            className="-ml-2 mb-1 gap-1.5"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            <span>All Visits</span>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <VisitStatusPill status={visit.visitStatus} />
            <Badge variant="outline">
              {isOwner ? "You are the Owner" : "You are the Buyer"}
            </Badge>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Site Visit Coordination
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Requested {formatVisitDate(visit.createdAt)}
          </p>
        </div>

        {/* Contextual Action Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {isOwner && isRequested ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRejectNote("");
                  setRejectOpen(true);
                }}
              >
                <XCircle className="size-4 text-destructive" aria-hidden="true" />
                <span>Decline</span>
              </Button>
              <Button
                variant="brand"
                size="sm"
                loading={approveBusy}
                onClick={handleApprove}
              >
                <CheckCircle2 className="size-4" aria-hidden="true" />
                <span>Approve for Broker Scheduling</span>
              </Button>
            </>
          ) : null}

          {isOpen && !(isOwner && isRequested) ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCancelReason("");
                setCancelOpen(true);
              }}
              className="text-destructive hover:text-destructive"
            >
              <Ban className="size-4" aria-hidden="true" />
              <span>Cancel visit</span>
            </Button>
          ) : null}
        </div>
      </div>

      {/* 5-Step Status Stepper */}
      <Card>
        <CardContent>
          <VisitStepper visit={visit} />
        </CardContent>
      </Card>

      {/* Confirmed Meet Card (when scheduled) */}
      {isScheduled ? (
        <Card className="border-success/40 bg-success-soft/35">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarCheck className="size-5 text-success" aria-hidden="true" />
              <CardTitle className="text-lg">Confirmed In-Person Meet</CardTitle>
            </div>
            <CardDescription>
              Coordinated by {visit.broker?.username || "your assigned broker"}.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-card p-3.5">
                <p className="text-xs font-semibold text-muted-foreground">
                  Date &amp; Time
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  {formatVisitDate(visit.schedule.startAt)}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatVisitTimeRange(
                    visit.schedule.startAt,
                    visit.schedule.durationMin,
                  )}
                </p>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card p-3.5">
                <p className="text-xs font-semibold text-muted-foreground">
                  Meeting Point
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  {visit.schedule.meetingPoint || prop.location || "At property location"}
                </p>
                {visit.schedule.notes ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Note: {visit.schedule.notes}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button variant="brand" size="sm" onClick={handleDownloadIcs}>
                <CalendarPlus className="size-4" aria-hidden="true" />
                <span>Add to Calendar (.ics)</span>
              </Button>
              {mapQuery ? (
                <Button asChild variant="outline" size="sm">
                  <a
                    href={buildMapsUrl(mapQuery)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin className="size-4 text-brand" aria-hidden="true" />
                    <span>Open in Maps</span>
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                  </a>
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Property Summary Card */}
      {prop._id ? (
        <Card>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              to={`/view/${prop._id}`}
              className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-2xl bg-muted sm:w-44"
            >
              {thumb ? (
                <img
                  src={thumb}
                  alt={prop.title || "Property"}
                  width={352}
                  height={264}
                  loading="lazy"
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-muted-foreground">
                  <Building2 className="size-7 opacity-50" aria-hidden="true" />
                </div>
              )}
              {prop.video?.url ? (
                <Badge
                  variant="glass"
                  className="absolute left-2 top-2 gap-1 px-2 py-0.5 text-[10px]"
                >
                  <Film className="size-3 text-brand" aria-hidden="true" />
                  <span>Video tour</span>
                </Badge>
              ) : null}
            </Link>

            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {prop.sellingType ? (
                  <Badge variant="secondary">
                    {prop.sellingType === "Rent System" ? "For Rent" : "For Sale"}
                  </Badge>
                ) : null}
                {prop.propertyType ? (
                  <Badge variant="outline">{prop.propertyType}</Badge>
                ) : null}
              </div>

              <Link
                to={`/view/${prop._id}`}
                className="text-lg font-bold text-foreground hover:text-brand transition-colors"
              >
                {prop.title || "View property"}
              </Link>

              <p className="text-base font-extrabold text-brand tabular-nums">
                {formatPrice(prop.price)}
                {prop.sellingType === "Rent System" ? (
                  <span className="text-xs font-medium text-muted-foreground">/mo</span>
                ) : null}
              </p>

              {prop.location ? (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="size-3.5 text-brand" aria-hidden="true" />
                  <span>{prop.location}</span>
                </p>
              ) : null}

              <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-muted-foreground">
                {prop.propertyType !== "Plot" && Number(prop.rooms) > 0 ? (
                  <span className="inline-flex items-center gap-1">
                    <Bed className="size-3.5" aria-hidden="true" />
                    {prop.rooms} Rooms
                  </span>
                ) : null}
                {prop.propertyType !== "Plot" && Number(prop.washrooms) > 0 ? (
                  <span className="inline-flex items-center gap-1">
                    <Bath className="size-3.5" aria-hidden="true" />
                    {prop.washrooms} Baths
                  </span>
                ) : null}
                {Number(prop.area) > 0 ? (
                  <span className="inline-flex items-center gap-1">
                    <Ruler className="size-3.5" aria-hidden="true" />
                    {prop.area} sq.ft
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:self-center">
              <Button asChild variant="outline" size="sm">
                <Link to={`/view/${prop._id}`}>
                  <span>View listing</span>
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                </Link>
              </Button>
              {isOwner ? (
                <Button asChild variant="ghost" size="sm">
                  <Link to={`/my/${prop._id}`}>Manage listing</Link>
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Two-column: People Involved + Preferred Slots & Notes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* People Involved */}
        <Card>
          <CardHeader>
            <CardTitle>People Involved</CardTitle>
            <CardDescription>
              Broker contact details appear automatically once a broker claims the visit.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <PersonRow
              roleLabel="Assigned Broker"
              person={visit.broker}
              highlight={Boolean(visit.broker)}
              emptyNote={
                visit.visitStatus === "requested"
                  ? "Assigned after the owner approves"
                  : visit.visitStatus === "owner_approved"
                    ? "Open in broker pool — waiting to be claimed"
                    : "No broker assigned"
              }
            />
            <PersonRow roleLabel="Property Owner" person={visit.owner} />
            <PersonRow roleLabel="Buyer / Visitor" person={visit.buyer} />
          </CardContent>
        </Card>

        {/* Preferred Slots & Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Preferred Slots &amp; Notes</CardTitle>
            <CardDescription>
              Time windows requested by the buyer when submitting this visit.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {Array.isArray(visit.preferredSlots) && visit.preferredSlots.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {visit.preferredSlots.map((slot, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-muted/35 px-3.5 py-2.5 text-sm font-medium text-foreground"
                  >
                    <Clock className="size-4 shrink-0 text-brand" aria-hidden="true" />
                    <span>Option {idx + 1}: {formatVisitDate(slot)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No preferred slots recorded.
              </p>
            )}

            {visit.note ? (
              <div className="rounded-2xl border border-border/70 bg-muted/35 p-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Buyer Note
                </p>
                <p className="selectable mt-1 text-sm leading-relaxed text-foreground">
                  {visit.note}
                </p>
              </div>
            ) : null}

            {visit.outcome ? (
              <div className="rounded-2xl border border-border/70 bg-muted/35 p-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Visit Outcome
                </p>
                <p className="selectable mt-1 text-sm leading-relaxed text-foreground">
                  {visit.outcome}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      {timeline.length > 0 ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <History className="size-4 text-brand" aria-hidden="true" />
              <CardTitle>Activity Timeline</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ol className="relative ml-3 flex flex-col gap-4 border-l border-border pl-5">
              {timeline.map((entry, idx) => (
                <li key={idx} className="relative">
                  <span
                    aria-hidden="true"
                    className="absolute -left-[25px] top-1.5 size-2.5 rounded-full bg-brand ring-4 ring-card"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {TIMELINE_LABELS[entry.action] || entry.action}
                    </span>
                    {entry.by ? (
                      <Badge variant="muted" className="px-2 py-0 text-[10px] capitalize">
                        {entry.by}
                      </Badge>
                    ) : null}
                    {entry.at ? (
                      <span className="text-xs text-muted-foreground">
                        · {timeAgo(entry.at)} ({formatVisitDate(entry.at, { withWeekday: false })})
                      </span>
                    ) : null}
                  </div>
                  {entry.note ? (
                    <p className="selectable mt-1 text-xs leading-relaxed text-muted-foreground">
                      {entry.note}
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      ) : null}

      {/* Owner Cancel Option even when requested */}
      {isOpen && isOwner && isRequested ? (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setCancelReason("");
              setCancelOpen(true);
            }}
            className="text-muted-foreground hover:text-destructive"
          >
            Cancel visit instead
          </Button>
        </div>
      ) : null}

      {/* Reject ConfirmDialog */}
      <ConfirmDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Decline this visit request?"
        description="The buyer will be notified that their visit request was declined."
        confirmLabel="Decline visit"
        cancelLabel="Go back"
        destructive
        onConfirm={handleReject}
      >
        <Field label="Optional note for the buyer">
          <Textarea
            rows={3}
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="e.g., Already rented out, or unavailable this week…"
          />
        </Field>
      </ConfirmDialog>

      {/* Cancel ConfirmDialog */}
      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel this site visit?"
        description="All parties (buyer, owner, and any assigned broker) will be notified immediately."
        confirmLabel="Yes, cancel visit"
        cancelLabel="Keep visit"
        destructive
        onConfirm={handleCancel}
      >
        <Field label="Reason for cancelling (optional)">
          <Textarea
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="e.g., Schedule conflict, found another property…"
          />
        </Field>
      </ConfirmDialog>
    </div>
  );
};

export default VisitDetail;
