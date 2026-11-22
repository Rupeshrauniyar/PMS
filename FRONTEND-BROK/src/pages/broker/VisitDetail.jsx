import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  MapPin,
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Mail,
  MessageCircle,
  Lock,
  Download,
  ExternalLink,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";

import { useApp } from "@/contexts/AppContext";
import { useLive } from "@/contexts/LiveContext";
import { useVisit } from "@/hooks/useVisits";
import { formatPrice, timeAgo } from "@/lib/format";
import {
  buildMapsUrl,
  downloadIcs,
  formatVisitDate,
  formatVisitTimeRange,
} from "@/lib/visit";
import { MediaGallery } from "@/components/ui/media-gallery";
import { VisitStatusPill, VisitStepper } from "@/components/ui/visit-status";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { Field, Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { ScheduleMeetSheet } from "@/components/broker/ScheduleMeetSheet";
import { ReassignBrokerSheet } from "@/components/broker/ReassignBrokerSheet";

function toWhatsAppUrl(phone, text = "") {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, "");
  if (!digits) return null;
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${digits}${q}`;
}

const TIMELINE_LABELS = {
  requested: "Requested by buyer",
  owner_approved: "Approved by owner",
  rejected: "Declined by owner",
  claimed: "Claimed by broker",
  released: "Released to pool",
  scheduled: "Visit scheduled",
  rescheduled: "Visit rescheduled",
  completed: "Completed",
  no_show: "No-show",
  cancelled: "Cancelled",
  reassigned: "Reassigned",
};

export default function VisitDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isSuperbroker } = useApp();
  const live = useLive();
  const { toast } = useToast();

  const {
    visit,
    setData: setVisit,
    loading,
    refreshing,
    error,
    pending,
    actions,
    refetch,
  } = useVisit(id);

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [prefilledSlot, setPrefilledSlot] = useState(null);
  const [reassignOpen, setReassignOpen] = useState(false);

  const [releaseOpen, setReleaseOpen] = useState(false);
  const [releaseReason, setReleaseReason] = useState("");

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const [concludeMode, setConcludeMode] = useState(null);
  const [outcomeNote, setOutcomeNote] = useState("");

  useEffect(() => {
    if (visit?.visitStatus === "claimed" && searchParams.get("schedule") === "1") {
      setScheduleOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete("schedule");
      setSearchParams(next, { replace: true });
    }
  }, [visit?.visitStatus, searchParams, setSearchParams]);

  const status = visit?.visitStatus;
  const prop = visit?.property || {};

  const concludeWindow = useMemo(() => {
    const startIso = visit?.schedule?.startAt;
    if (!startIso) return { allowed: false, unlockIso: null };
    const startMs = new Date(startIso).getTime();
    if (Number.isNaN(startMs)) return { allowed: true, unlockIso: null };
    const unlockMs = startMs - 60 * 60 * 1000;
    return {
      allowed: Date.now() >= unlockMs,
      unlockIso: new Date(unlockMs).toISOString(),
    };
  }, [visit?.schedule?.startAt]);

  const canSuperbrokerReassign =
    isSuperbroker && ["owner_approved", "claimed", "scheduled"].includes(status);

  const contactsUnlocked = Boolean(
    isSuperbroker ||
      status !== "owner_approved" ||
      visit?.buyer?.phone ||
      visit?.buyer?.email ||
      visit?.owner?.phone ||
      visit?.owner?.email,
  );

  const openSchedulerWithSlot = (slotIso = null) => {
    setPrefilledSlot(slotIso);
    setScheduleOpen(true);
  };

  const handleClaim = async () => {
    const res = await actions.claim();
    if (res.ok) {
      live?.setPoolCount?.((c) => Math.max(0, (c ?? 1) - 1));
      toast({ variant: "success", title: "Visit claimed" });
      setPrefilledSlot(null);
      setScheduleOpen(true);
    } else if (res.conflict) {
      live?.refreshPoolCount?.();
      toast({ variant: "error", title: "Already claimed by another broker" });
    } else {
      toast({ variant: "error", title: res.message || "Could not claim visit" });
    }
  };

  const handleRelease = async () => {
    const res = await actions.release(releaseReason.trim());
    if (res.ok) {
      live?.refreshPoolCount?.();
      toast({ variant: "success", title: "Released to pool" });
      setReleaseReason("");
      setReleaseOpen(false);
    } else {
      toast({ variant: "error", title: res.message || "Could not release" });
      throw new Error(res.message);
    }
  };

  const handleCancel = async () => {
    const res = await actions.cancel(cancelReason.trim());
    if (res.ok) {
      toast({ variant: "success", title: "Visit cancelled" });
      setCancelReason("");
      setCancelOpen(false);
    } else {
      toast({ variant: "error", title: res.message || "Could not cancel" });
      throw new Error(res.message);
    }
  };

  const handleConclude = async (e) => {
    e?.preventDefault();
    if (!concludeMode) return;
    const res =
      concludeMode === "complete"
        ? await actions.complete(outcomeNote.trim())
        : await actions.noShow(outcomeNote.trim());

    if (res.ok) {
      toast({
        variant: "success",
        title: concludeMode === "complete" ? "Marked completed" : "Marked no-show",
      });
      setOutcomeNote("");
      setConcludeMode(null);
    } else {
      toast({ variant: "error", title: res.message || "Action failed" });
    }
  };

  const timelineSorted = useMemo(() => {
    const list = [...(visit?.timeline || [])];
    return list.sort(
      (a, b) => new Date(b.at || 0).getTime() - new Date(a.at || 0).getTime(),
    );
  }, [visit?.timeline]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-5 py-2">
        <Skeleton className="h-9 w-28 rounded-full" />
        <Skeleton className="aspect-[16/10] w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !visit) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>Back</span>
        </Button>
        <EmptyState
          icon={AlertTriangle}
          title="Visit unavailable"
          description={error?.message}
          action={
            <Button variant="outline" size="sm" onClick={() => navigate("/pool")}>
              Open Pool
            </Button>
          }
        />
      </div>
    );
  }

  const preferredSlots = visit.preferredSlots || [];
  const canPickSlot = status === "claimed" || status === "scheduled";
  const specs = [
    prop.sellingType === "Rent System" ? "Rent" : prop.sellingType ? "Sale" : null,
    prop.propertyType,
    prop.rooms ? `${prop.rooms} rooms` : null,
    prop.washrooms ? `${prop.washrooms} baths` : null,
    prop.area ? `${prop.area}` : null,
  ].filter(Boolean);

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-2">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="inline-flex size-9 items-center justify-center rounded-full border border-border hover:bg-accent"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </button>
          <VisitStatusPill status={status} />
        </div>

        <div className="flex items-center gap-2">
          {canSuperbrokerReassign ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReassignOpen(true)}
              className="rounded-full"
            >
              <ShieldCheck className="size-4" aria-hidden="true" />
              <span>Reassign</span>
            </Button>
          ) : null}
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
      </div>

      {/* Media Gallery (Video + Photos) */}
      <MediaGallery
        images={prop.images || []}
        video={prop.video || null}
        title={prop.title || "Property"}
      />

      {/* Property Header */}
      <div className="space-y-2 border-b border-border pb-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {prop.title || "Property"}
          </h1>
          <p className="text-lg font-bold tabular-nums text-foreground sm:text-xl">
            {formatPrice(prop.price ?? visit.price)}
            {prop.sellingType === "Rent System" ? (
              <span className="text-xs font-normal text-muted-foreground"> /mo</span>
            ) : null}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            <span>{prop.location || "Location on request"}</span>
          </span>
          {prop.location ? (
            <a
              href={buildMapsUrl(prop.location)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-foreground hover:underline"
            >
              <span>Maps</span>
              <ExternalLink className="size-3" aria-hidden="true" />
            </a>
          ) : null}
        </div>

        {specs.length > 0 ? (
          <p className="text-xs text-muted-foreground">{specs.join(" · ")}</p>
        ) : null}
      </div>

      {/* Stepper */}
      <VisitStepper visit={visit} />

      {/* Action Bar */}
      {(status === "owner_approved" ||
        status === "claimed" ||
        status === "scheduled") ? (
        <div className="space-y-2 rounded-2xl border border-border p-4">
          <div className="flex flex-wrap items-center gap-2">
            {status === "owner_approved" ? (
              <Button
                loading={pending === "claim"}
                onClick={handleClaim}
                className="rounded-full px-6"
              >
                Claim Visit
              </Button>
            ) : null}

            {status === "claimed" ? (
              <>
                <Button
                  onClick={() => openSchedulerWithSlot(null)}
                  className="rounded-full px-5"
                >
                  <CalendarClock className="size-4" aria-hidden="true" />
                  <span>Schedule Meet</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setReleaseOpen(true)}
                  disabled={Boolean(pending)}
                  className="rounded-full"
                >
                  Release
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setCancelOpen(true)}
                  disabled={Boolean(pending)}
                  className="rounded-full text-destructive"
                >
                  Cancel
                </Button>
              </>
            ) : null}

            {status === "scheduled" ? (
              <>
                <Button
                  disabled={!concludeWindow.allowed || Boolean(pending)}
                  onClick={() => {
                    setOutcomeNote(visit.outcome || "");
                    setConcludeMode("complete");
                  }}
                  className="rounded-full px-5"
                >
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                  <span>Complete</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => openSchedulerWithSlot(null)}
                  disabled={Boolean(pending)}
                  className="rounded-full"
                >
                  Reschedule
                </Button>

                <Button
                  variant="outline"
                  disabled={!concludeWindow.allowed || Boolean(pending)}
                  onClick={() => {
                    setOutcomeNote(visit.outcome || "");
                    setConcludeMode("no_show");
                  }}
                  className="rounded-full"
                >
                  No-show
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => setCancelOpen(true)}
                  disabled={Boolean(pending)}
                  className="rounded-full text-destructive"
                >
                  Cancel
                </Button>
              </>
            ) : null}
          </div>

          {status === "scheduled" && !concludeWindow.allowed && concludeWindow.unlockIso ? (
            <p className="text-xs text-muted-foreground">
              Completion unlocks at {formatVisitDate(concludeWindow.unlockIso)}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Confirmed Meet Details */}
      {visit.schedule?.startAt &&
      ["scheduled", "completed", "no_show"].includes(status) ? (
        <section className="space-y-3 rounded-2xl border border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Confirmed Meet</p>
              <p className="text-sm font-bold text-foreground">
                {formatVisitDate(visit.schedule.startAt)} ·{" "}
                {formatVisitTimeRange(visit.schedule.startAt, visit.schedule.durationMin)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => {
                  if (downloadIcs(visit)) {
                    toast({ title: "Calendar (.ics) downloaded" });
                  }
                }}
              >
                <Download className="size-3.5" aria-hidden="true" />
                <span>.ics</span>
              </Button>
              <Button variant="outline" size="sm" asChild className="rounded-full">
                <a
                  href={buildMapsUrl(visit.schedule.meetingPoint || prop.location)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MapPin className="size-3.5" aria-hidden="true" />
                  <span>Directions</span>
                </a>
              </Button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Meet at:</span>{" "}
            {visit.schedule.meetingPoint || prop.location || "Property"}
          </p>

          {visit.schedule.notes ? (
            <p className="rounded-xl bg-secondary/50 px-3 py-2 text-xs text-foreground whitespace-pre-line">
              {visit.schedule.notes}
            </p>
          ) : null}

          {visit.outcome ? (
            <p className="rounded-xl bg-secondary/50 px-3 py-2 text-xs text-foreground whitespace-pre-line">
              <span className="font-semibold">Outcome: </span>
              {visit.outcome}
            </p>
          ) : null}
        </section>
      ) : null}

      {/* Buyer Note & Preferred Slots */}
      {(visit.note || preferredSlots.length > 0) ? (
        <section className="space-y-3 rounded-2xl border border-border p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Buyer Request
          </p>
          {visit.note ? (
            <p className="text-sm text-foreground">{visit.note}</p>
          ) : null}

          {preferredSlots.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {preferredSlots.map((slot, idx) => {
                const isPast = new Date(slot).getTime() <= Date.now();
                return canPickSlot && !isPast ? (
                  <button
                    key={`${slot}-${idx}`}
                    type="button"
                    onClick={() => openSchedulerWithSlot(slot)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-foreground/30 px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-foreground hover:text-background"
                  >
                    <CalendarClock className="size-3.5" aria-hidden="true" />
                    <span>{formatVisitDate(slot)}</span>
                  </button>
                ) : (
                  <span
                    key={`${slot}-${idx}`}
                    className={`inline-flex items-center rounded-full border border-border px-3 py-1.5 text-xs ${
                      isPast ? "text-muted-foreground line-through" : "text-foreground"
                    }`}
                  >
                    {formatVisitDate(slot)}
                  </span>
                );
              })}
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Contacts */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">People</h2>
          {!contactsUnlocked ? (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="size-3" aria-hidden="true" />
              <span>Claim to unlock numbers</span>
            </span>
          ) : null}
        </div>

        <div className="divide-y divide-border rounded-2xl border border-border">
          <PartyRow
            role="Buyer"
            person={visit.buyer}
            locked={!contactsUnlocked}
            waText={`Hi ${visit.buyer?.username || ""}, I am your Propatyc broker for "${prop.title || "the property"}".`}
          />
          <PartyRow
            role="Owner"
            person={visit.owner}
            locked={!contactsUnlocked}
            waText={`Hi ${visit.owner?.username || ""}, I am the Propatyc broker for "${prop.title || "your listing"}".`}
          />
          {visit.broker ? (
            <PartyRow
              role="Broker"
              person={visit.broker}
              locked={false}
              waText={`Hi ${visit.broker?.username || ""}, checking in regarding "${prop.title || "property"}".`}
            />
          ) : null}
        </div>
      </section>

      {/* Collapsible Activity Log */}
      {timelineSorted.length > 0 ? (
        <details className="group rounded-2xl border border-border px-4 py-3">
          <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Activity ({timelineSorted.length})</span>
            <ChevronDown
              className="size-4 transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <ol className="mt-3 space-y-2.5 border-t border-border pt-3">
            {timelineSorted.map((entry, idx) => (
              <li
                key={`${entry.action}-${entry.at}-${idx}`}
                className="flex flex-col gap-0.5 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-foreground">
                    {TIMELINE_LABELS[entry.action] || entry.action || "Updated"}
                    {entry.by ? (
                      <span className="font-normal text-muted-foreground"> · {entry.by}</span>
                    ) : null}
                  </span>
                  {entry.at ? (
                    <span className="text-muted-foreground">{timeAgo(entry.at)}</span>
                  ) : null}
                </div>
                {entry.note ? (
                  <p className="text-muted-foreground">{entry.note}</p>
                ) : null}
              </li>
            ))}
          </ol>
        </details>
      ) : null}

      {/* Sheets & Dialogs */}
      <ScheduleMeetSheet
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        visit={visit}
        initialSlotIso={prefilledSlot}
        onScheduled={(updated) => {
          if (updated) setVisit(updated);
          else refetch();
        }}
      />

      <ReassignBrokerSheet
        open={reassignOpen}
        onOpenChange={setReassignOpen}
        visit={visit}
        onReassigned={(updated) => {
          if (updated) setVisit(updated);
          else refetch();
        }}
      />

      <ConfirmDialog
        open={releaseOpen}
        onOpenChange={setReleaseOpen}
        title="Release to Open Pool?"
        description="Another broker will be able to claim this visit."
        confirmLabel="Release"
        onConfirm={handleRelease}
      >
        <Field label="Reason (optional)">
          <Textarea
            rows={2}
            value={releaseReason}
            onChange={(e) => setReleaseReason(e.target.value)}
            placeholder="Schedule conflict..."
          />
        </Field>
      </ConfirmDialog>

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel visit?"
        description="Buyer and owner will be notified."
        confirmLabel="Cancel Visit"
        destructive
        onConfirm={handleCancel}
      >
        <Field label="Reason">
          <Textarea
            rows={2}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Reason for cancellation..."
          />
        </Field>
      </ConfirmDialog>

      <Dialog
        open={Boolean(concludeMode)}
        onOpenChange={(v) => {
          if (!v && !pending) setConcludeMode(null);
        }}
        title={concludeMode === "complete" ? "Mark Completed" : "Record No-show"}
        dismissible={!pending}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setConcludeMode(null)}
              disabled={Boolean(pending)}
            >
              Cancel
            </Button>
            <Button
              variant={concludeMode === "complete" ? "default" : "destructive"}
              onClick={handleConclude}
              loading={pending === "complete" || pending === "noShow"}
            >
              Confirm
            </Button>
          </>
        }
      >
        <form onSubmit={handleConclude}>
          <Field label="Notes (optional)">
            <Textarea
              rows={3}
              data-autofocus=""
              value={outcomeNote}
              onChange={(e) => setOutcomeNote(e.target.value)}
              placeholder={
                concludeMode === "complete"
                  ? "Buyer feedback or next steps..."
                  : "Who missed the appointment..."
              }
            />
          </Field>
        </form>
      </Dialog>
    </div>
  );
}

function PartyRow({ role, person, locked, waText }) {
  const waUrl = !locked && person?.phone ? toWhatsAppUrl(person.phone, waText) : null;
  return (
    <div className="flex items-center justify-between gap-3 p-3.5">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar src={person?.pp} name={person?.username || role} size="sm" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground">
              {person?.username || role}
            </p>
            <span className="text-[11px] font-medium text-muted-foreground">{role}</span>
          </div>
          {locked ? (
            <p className="text-xs text-muted-foreground">Hidden until claimed</p>
          ) : (
            <p className="truncate text-xs text-muted-foreground selectable">
              {[person?.phone, person?.email].filter(Boolean).join(" · ") || "No contact info"}
            </p>
          )}
        </div>
      </div>

      {!locked && person ? (
        <div className="flex shrink-0 items-center gap-1.5">
          {person.phone ? (
            <a
              href={`tel:${person.phone}`}
              aria-label={`Call ${person.username || role}`}
              className="inline-flex size-8 items-center justify-center rounded-full border border-border text-foreground hover:bg-accent"
            >
              <Phone className="size-3.5" aria-hidden="true" />
            </a>
          ) : null}
          {waUrl ? (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`WhatsApp ${person.username || role}`}
              className="inline-flex size-8 items-center justify-center rounded-full border border-border text-foreground hover:bg-accent"
            >
              <MessageCircle className="size-3.5" aria-hidden="true" />
            </a>
          ) : null}
          {person.email ? (
            <a
              href={`mailto:${person.email}`}
              aria-label={`Email ${person.username || role}`}
              className="inline-flex size-8 items-center justify-center rounded-full border border-border text-foreground hover:bg-accent"
            >
              <Mail className="size-3.5" aria-hidden="true" />
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
