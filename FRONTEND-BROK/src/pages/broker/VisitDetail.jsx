import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  MapPin,
  BedDouble,
  Bath,
  Maximize2,
  Building2,
  CalendarClock,
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  Ban,
  Undo2,
  Hand,
  Phone,
  Mail,
  MessageCircle,
  Lock,
  Download,
  ExternalLink,
  ShieldCheck,
  Clock,
  Sparkles,
  MessageSquareQuote,
  History,
  UserCheck,
  User,
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

const TIMELINE_META = {
  requested: { label: "Visit requested by buyer", icon: Clock, tone: "text-warning bg-warning-soft" },
  owner_approved: { label: "Approved by property owner", icon: CheckCircle2, tone: "text-info bg-info-soft" },
  rejected: { label: "Declined by owner", icon: Ban, tone: "text-destructive bg-danger-soft" },
  claimed: { label: "Claimed by broker", icon: UserCheck, tone: "text-brand bg-brand-soft" },
  released: { label: "Released back to open pool", icon: Undo2, tone: "text-warning bg-warning-soft" },
  scheduled: { label: "3-way site visit scheduled", icon: CalendarCheck, tone: "text-success bg-success-soft" },
  rescheduled: { label: "Site visit rescheduled", icon: CalendarClock, tone: "text-info bg-info-soft" },
  completed: { label: "Site visit completed", icon: CheckCircle2, tone: "text-success bg-success-soft" },
  no_show: { label: "Marked as no-show", icon: AlertTriangle, tone: "text-destructive bg-danger-soft" },
  cancelled: { label: "Visit cancelled", icon: Ban, tone: "text-muted-foreground bg-muted" },
  reassigned: { label: "Reassigned to broker", icon: ShieldCheck, tone: "text-brand bg-brand-soft" },
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

  const [concludeMode, setConcludeMode] = useState(null); // "complete" | "no_show" | null
  const [outcomeNote, setOutcomeNote] = useState("");

  // Auto-open scheduler when navigated from Pool Claim (`?schedule=1`)
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

  // Backend enforces completion / no-show starting 1 hour before `schedule.startAt`
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
      toast({
        variant: "success",
        title: "Visit claimed! Schedule the 3-way meet now.",
      });
      setPrefilledSlot(null);
      setScheduleOpen(true);
    } else if (res.conflict) {
      live?.refreshPoolCount?.();
      toast({
        variant: "error",
        title: "Another broker claimed this visit first",
        description: res.message,
      });
    } else {
      toast({
        variant: "error",
        title: "Couldn't claim visit",
        description: res.message,
      });
    }
  };

  const handleRelease = async () => {
    const res = await actions.release(releaseReason.trim());
    if (res.ok) {
      live?.refreshPoolCount?.();
      toast({
        variant: "success",
        title: "Visit released back to the Open Pool",
      });
      setReleaseReason("");
      setReleaseOpen(false);
    } else {
      toast({
        variant: "error",
        title: "Couldn't release visit",
        description: res.message,
      });
      throw new Error(res.message);
    }
  };

  const handleCancel = async () => {
    const res = await actions.cancel(cancelReason.trim());
    if (res.ok) {
      toast({
        variant: "success",
        title: "Visit cancelled",
        description: "Buyer and property owner have been notified.",
      });
      setCancelReason("");
      setCancelOpen(false);
    } else {
      toast({
        variant: "error",
        title: "Couldn't cancel visit",
        description: res.message,
      });
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
        title:
          concludeMode === "complete"
            ? "Visit marked as completed!"
            : "Visit recorded as no-show",
      });
      setOutcomeNote("");
      setConcludeMode(null);
    } else {
      toast({
        variant: "error",
        title: "Action failed",
        description: res.message,
      });
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
        <Skeleton className="aspect-[16/9] w-full rounded-3xl" />
        <Skeleton className="h-28 w-full rounded-3xl" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Skeleton className="h-44 rounded-3xl" />
          <Skeleton className="h-44 rounded-3xl" />
          <Skeleton className="h-44 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error || !visit) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>Back</span>
        </Button>
        <EmptyState
          icon={AlertTriangle}
          title="Couldn't load site visit"
          description={error?.message || "This visit may have been claimed by another broker or removed."}
          action={
            <>
              <Button variant="outline" size="sm" onClick={refetch}>
                Retry
              </Button>
              <Button variant="brand" size="sm" onClick={() => navigate("/pool")}>
                Back to Open Pool
              </Button>
            </>
          }
        />
      </div>
    );
  }

  const preferredSlots = visit.preferredSlots || [];
  const canPickSlot = status === "claimed" || status === "scheduled";

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span>Back</span>
          </Button>
          <VisitStatusPill status={status} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canSuperbrokerReassign ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReassignOpen(true)}
            >
              <ShieldCheck className="size-4 text-brand" aria-hidden="true" />
              <span>Reassign Broker</span>
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            onClick={refetch}
            loading={refreshing}
            aria-label="Refresh visit details"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Property Showcase + Specs */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <MediaGallery
            images={prop.images || []}
            video={prop.video || null}
            title={prop.title || "Property"}
          />
        </div>

        <div className="flex flex-col justify-between gap-4 lg:col-span-5">
          <Card className="h-full justify-between">
            <CardHeader className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {prop.sellingType ? (
                  <Badge variant="brand">
                    {prop.sellingType === "Rent System" ? "For Rent" : "For Sale"}
                  </Badge>
                ) : null}
                {prop.propertyType ? (
                  <Badge variant="secondary">{prop.propertyType}</Badge>
                ) : null}
              </div>

              <CardTitle className="text-xl font-extrabold sm:text-2xl">
                {prop.title || "Property"}
              </CardTitle>

              <CardDescription className="flex items-center gap-1.5 text-sm">
                <MapPin className="size-4 shrink-0 text-brand" aria-hidden="true" />
                <span>{prop.location || "Location on request"}</span>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Listed Price
                </p>
                <p className="mt-0.5 text-2xl font-extrabold tracking-tight text-foreground">
                  {formatPrice(prop.price ?? visit.price)}
                  {prop.sellingType === "Rent System" ? (
                    <span className="ml-1 text-sm font-medium text-muted-foreground">
                      / month
                    </span>
                  ) : null}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <SpecTile icon={BedDouble} label="Rooms" value={prop.rooms || "—"} />
                <SpecTile icon={Bath} label="Washrooms" value={prop.washrooms || "—"} />
                <SpecTile icon={Maximize2} label="Area" value={prop.area || "—"} />
              </div>

              {prop.location ? (
                <Button variant="outline" size="sm" asChild className="w-full">
                  <a
                    href={buildMapsUrl(prop.location)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin className="size-4" aria-hidden="true" />
                    <span>View Property Area on Google Maps</span>
                    <ExternalLink className="size-3.5 opacity-65" aria-hidden="true" />
                  </a>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Visit Lifecycle Stepper */}
      <Card>
        <CardHeader>
          <CardTitle>Visit Lifecycle</CardTitle>
          <CardDescription>
            Track every milestone from buyer request through completed site tour
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VisitStepper visit={visit} />
        </CardContent>
      </Card>

      {/* Broker Command Bar (Actions by State) */}
      {(status === "owner_approved" ||
        status === "claimed" ||
        status === "scheduled" ||
        canSuperbrokerReassign) ? (
        <Card className="border-brand/35 bg-card ring-1 ring-brand/15">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-brand" aria-hidden="true" />
              <span>
                {status === "owner_approved"
                  ? "Open Pool Request — Ready to Claim"
                  : status === "claimed"
                    ? "Coordinate & Schedule 3-Way Site Visit"
                    : status === "scheduled"
                      ? "Manage Scheduled Site Visit"
                      : "Superbroker Controls"}
              </span>
            </CardTitle>
            <CardDescription>
              {status === "owner_approved"
                ? "Claim this visit to lock it to your queue and unlock buyer & owner phone numbers."
                : status === "claimed"
                  ? "Call or message both parties to confirm availability, then set the official date, time, and meeting point."
                  : status === "scheduled"
                    ? concludeWindow.allowed
                      ? "After conducting the tour, record whether the visit was completed or a no-show."
                      : `Completion & no-show reporting unlock 1 hour before start (${formatVisitDate(concludeWindow.unlockIso)}).`
                    : "Transfer broker assignment if needed."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              {status === "owner_approved" ? (
                <Button
                  variant="brand"
                  loading={pending === "claim"}
                  onClick={handleClaim}
                >
                  <Hand className="size-4" aria-hidden="true" />
                  <span>Claim Visit</span>
                </Button>
              ) : null}

              {status === "claimed" ? (
                <>
                  <Button
                    variant="brand"
                    onClick={() => openSchedulerWithSlot(null)}
                  >
                    <CalendarClock className="size-4" aria-hidden="true" />
                    <span>Schedule 3-Way Meet</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setReleaseOpen(true)}
                    disabled={Boolean(pending)}
                  >
                    <Undo2 className="size-4" aria-hidden="true" />
                    <span>Release to Pool</span>
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setCancelOpen(true)}
                    disabled={Boolean(pending)}
                  >
                    <Ban className="size-4" aria-hidden="true" />
                    <span>Cancel Visit</span>
                  </Button>
                </>
              ) : null}

              {status === "scheduled" ? (
                <>
                  <Button
                    variant="brand"
                    disabled={!concludeWindow.allowed || Boolean(pending)}
                    onClick={() => {
                      setOutcomeNote(visit.outcome || "");
                      setConcludeMode("complete");
                    }}
                  >
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                    <span>Mark Completed</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => openSchedulerWithSlot(null)}
                    disabled={Boolean(pending)}
                  >
                    <CalendarClock className="size-4" aria-hidden="true" />
                    <span>Reschedule Meet</span>
                  </Button>

                  <Button
                    variant="secondary"
                    disabled={!concludeWindow.allowed || Boolean(pending)}
                    onClick={() => {
                      setOutcomeNote(visit.outcome || "");
                      setConcludeMode("no_show");
                    }}
                  >
                    <AlertTriangle className="size-4 text-destructive" aria-hidden="true" />
                    <span>Mark No-Show</span>
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={() => setCancelOpen(true)}
                    disabled={Boolean(pending)}
                  >
                    <Ban className="size-4" aria-hidden="true" />
                    <span>Cancel Visit</span>
                  </Button>
                </>
              ) : null}

              {canSuperbrokerReassign ? (
                <Button
                  variant="outline"
                  onClick={() => setReassignOpen(true)}
                  disabled={Boolean(pending)}
                >
                  <ShieldCheck className="size-4 text-brand" aria-hidden="true" />
                  <span>Reassign Broker</span>
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Confirmed Meet Card */}
      {visit.schedule?.startAt &&
      ["scheduled", "completed", "no_show"].includes(status) ? (
        <Card className="border-success/35 bg-card">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2">
                <CalendarCheck className="size-5 text-success" aria-hidden="true" />
                <span>Confirmed 3-Way Site Visit</span>
              </CardTitle>
              <Badge variant="success">
                {formatVisitTimeRange(visit.schedule.startAt, visit.schedule.durationMin)}
              </Badge>
            </div>
            <CardDescription>
              Shared with buyer, property owner, and assigned broker
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-muted/40 p-3.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Date &amp; Time
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  {formatVisitDate(visit.schedule.startAt)}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatVisitTimeRange(visit.schedule.startAt, visit.schedule.durationMin)}
                </p>
              </div>

              <div className="rounded-2xl border border-border/70 bg-muted/40 p-3.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Meeting Point
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  {visit.schedule.meetingPoint || prop.location || "At property"}
                </p>
              </div>
            </div>

            {visit.schedule.notes ? (
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-3.5 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Broker Instructions
                </p>
                <p className="mt-1 whitespace-pre-line text-foreground">
                  {visit.schedule.notes}
                </p>
              </div>
            ) : null}

            {visit.outcome ? (
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-3.5 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Visit Outcome Note
                </p>
                <p className="mt-1 whitespace-pre-line text-foreground">{visit.outcome}</p>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (downloadIcs(visit)) {
                    toast({
                      variant: "success",
                      title: "Calendar invite (.ics) downloaded",
                    });
                  }
                }}
              >
                <Download className="size-4" aria-hidden="true" />
                <span>Add to Calendar (.ics)</span>
              </Button>

              <Button variant="outline" size="sm" asChild>
                <a
                  href={buildMapsUrl(visit.schedule.meetingPoint || prop.location)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MapPin className="size-4" aria-hidden="true" />
                  <span>Open in Google Maps</span>
                  <ExternalLink className="size-3.5 opacity-65" aria-hidden="true" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Buyer's Request Card (Note + Clickable Preferred Time Slots) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquareQuote className="size-5 text-brand" aria-hidden="true" />
            <span>Buyer&apos;s Visit Request</span>
          </CardTitle>
          <CardDescription>
            {canPickSlot
              ? "Click any preferred time slot below to pre-fill the 3-way meeting scheduler."
              : "Submitted by the buyer when requesting this site tour."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-border/70 bg-muted/35 p-4 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Buyer&apos;s Note
            </p>
            <p className="mt-1 text-foreground">
              {visit.note ? visit.note : "No additional note provided by the buyer."}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Preferred Time Slots ({preferredSlots.length})
            </p>
            {preferredSlots.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Buyer is flexible — coordinate directly by phone or WhatsApp.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {preferredSlots.map((slot, idx) => {
                  const isPast = new Date(slot).getTime() <= Date.now();
                  return canPickSlot && !isPast ? (
                    <button
                      key={`${slot}-${idx}`}
                      type="button"
                      onClick={() => openSchedulerWithSlot(slot)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-brand/35 bg-brand-soft/55 px-3.5 py-2 text-xs font-bold text-foreground shadow-soft transition-all hover:border-brand hover:bg-brand hover:text-brand-foreground"
                    >
                      <CalendarClock className="size-4" aria-hidden="true" />
                      <span>{formatVisitDate(slot)}</span>
                      <span className="rounded-md bg-card/80 px-1.5 py-0.5 text-[10px] font-semibold text-foreground">
                        Schedule this slot
                      </span>
                    </button>
                  ) : (
                    <span
                      key={`${slot}-${idx}`}
                      className={`inline-flex items-center gap-1.5 rounded-2xl border px-3.5 py-2 text-xs font-semibold ${
                        isPast
                          ? "border-border/60 bg-muted/50 text-muted-foreground line-through"
                          : "border-border bg-card text-foreground"
                      }`}
                    >
                      <Clock className="size-3.5 text-muted-foreground" aria-hidden="true" />
                      <span>{formatVisitDate(slot)}</span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 3-Party Contact Hub */}
      <section aria-labelledby="contact-hub-heading" className="space-y-3.5">
        <div>
          <h2 id="contact-hub-heading" className="text-lg font-bold tracking-tight">
            3-Party Contact Hub
          </h2>
          <p className="text-xs text-muted-foreground">
            Direct one-tap Call, WhatsApp, and Email for the buyer, property owner, and assigned broker
          </p>
        </div>

        {!contactsUnlocked ? (
          <Card className="border-dashed border-brand/40 bg-brand-soft/25">
            <CardContent className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand text-brand-foreground">
                  <Lock className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Claim this visit to unlock buyer &amp; owner phone numbers
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    For privacy, direct phone numbers and email addresses are hidden while a visit sits in the Open Pool.
                  </p>
                </div>
              </div>
              <Button
                variant="brand"
                size="sm"
                loading={pending === "claim"}
                onClick={handleClaim}
              >
                <Hand className="size-4" aria-hidden="true" />
                <span>Claim Visit Now</span>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <PartyContactCard
            roleLabel="Buyer"
            roleIcon={User}
            person={visit.buyer}
            locked={!contactsUnlocked}
            whatsAppMessage={`Hello ${visit.buyer?.username || ""}, I am your assigned Propatyc broker regarding your site visit request for "${prop.title || "the property"}".`}
          />
          <PartyContactCard
            roleLabel="Property Owner"
            roleIcon={Building2}
            person={visit.owner}
            locked={!contactsUnlocked}
            whatsAppMessage={`Hello ${visit.owner?.username || ""}, I am the Propatyc broker coordinating the site visit for your listing "${prop.title || "property"}".`}
          />
          <PartyContactCard
            roleLabel="Assigned Broker"
            roleIcon={UserCheck}
            person={visit.broker}
            emptyText="Unassigned — currently in Open Pool"
            whatsAppMessage={`Hi ${visit.broker?.username || ""}, checking in regarding Propatyc visit for "${prop.title || "property"}".`}
          />
        </div>
      </section>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="size-5 text-brand" aria-hidden="true" />
            <span>Activity Timeline</span>
          </CardTitle>
          <CardDescription>
            Complete audit trail of actions across buyer, owner, and broker
          </CardDescription>
        </CardHeader>
        <CardContent>
          {timelineSorted.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
          ) : (
            <ol className="relative space-y-4 border-l border-border/80 pl-5 ml-2">
              {timelineSorted.map((entry, idx) => {
                const meta = TIMELINE_META[entry.action] || {
                  label: entry.action || "Update",
                  icon: Clock,
                  tone: "text-muted-foreground bg-muted",
                };
                const Icon = meta.icon;
                return (
                  <li key={`${entry.action}-${entry.at}-${idx}`} className="relative">
                    <span
                      className={`absolute -left-[1.85rem] top-0.5 flex size-6 items-center justify-center rounded-full ring-4 ring-card ${meta.tone}`}
                    >
                      <Icon className="size-3.5" aria-hidden="true" />
                    </span>
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{meta.label}</p>
                        {entry.by ? (
                          <Badge variant="muted" className="px-2 py-0 text-[10px] capitalize">
                            by {entry.by}
                          </Badge>
                        ) : null}
                      </div>
                      {entry.at ? (
                        <time
                          dateTime={entry.at}
                          className="text-xs text-muted-foreground"
                          title={formatVisitDate(entry.at)}
                        >
                          {formatVisitDate(entry.at)} ({timeAgo(entry.at)})
                        </time>
                      ) : null}
                    </div>
                    {entry.note ? (
                      <p className="mt-1 rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground selectable">
                        {entry.note}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          )}
        </CardContent>
      </Card>

      {/* Schedule / Reschedule Sheet */}
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

      {/* Superbroker Reassign Sheet */}
      <ReassignBrokerSheet
        open={reassignOpen}
        onOpenChange={setReassignOpen}
        visit={visit}
        onReassigned={(updated) => {
          if (updated) setVisit(updated);
          else refetch();
        }}
      />

      {/* Release Back to Pool Dialog */}
      <ConfirmDialog
        open={releaseOpen}
        onOpenChange={setReleaseOpen}
        title="Release visit back to Open Pool?"
        description="Another Propatyc broker will be able to claim and schedule this site visit."
        confirmLabel="Release to Pool"
        onConfirm={handleRelease}
      >
        <Field label="Reason (optional)" hint="Recorded in the visit timeline">
          <Textarea
            rows={3}
            value={releaseReason}
            onChange={(e) => setReleaseReason(e.target.value)}
            placeholder="e.g., Schedule conflict in this area today..."
          />
        </Field>
      </ConfirmDialog>

      {/* Cancel Visit Dialog */}
      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel this site visit?"
        description="Both the buyer and property owner will be notified immediately that this visit has been cancelled."
        confirmLabel="Cancel Visit"
        destructive
        onConfirm={handleCancel}
      >
        <Field label="Cancellation reason" hint="Shared with buyer & property owner">
          <Textarea
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Explain why the visit is being cancelled..."
          />
        </Field>
      </ConfirmDialog>

      {/* Mark Completed / Mark No-Show Dialog */}
      <Dialog
        open={Boolean(concludeMode)}
        onOpenChange={(v) => {
          if (!v && !pending) setConcludeMode(null);
        }}
        title={
          concludeMode === "complete"
            ? "Mark Site Visit as Completed"
            : "Record Site Visit No-Show"
        }
        description={
          concludeMode === "complete"
            ? "Add an outcome summary (buyer feedback, next steps, or offer interest)."
            : "Note which party missed the scheduled appointment and any follow-up context."
        }
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
              variant={concludeMode === "complete" ? "brand" : "destructive"}
              onClick={handleConclude}
              loading={pending === "complete" || pending === "noShow"}
            >
              {concludeMode === "complete" ? "Confirm Completed" : "Confirm No-Show"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleConclude}>
          <Field
            label="Outcome / Notes"
            hint="Stored on the visit record"
          >
            <Textarea
              rows={4}
              data-autofocus=""
              value={outcomeNote}
              onChange={(e) => setOutcomeNote(e.target.value)}
              placeholder={
                concludeMode === "complete"
                  ? "e.g., Buyer loved the natural light and wants to discuss lease terms..."
                  : "e.g., Waited 25 minutes at the meeting point; buyer could not be reached..."
              }
            />
          </Field>
        </form>
      </Dialog>
    </div>
  );
}

function SpecTile({ icon, label, value }) {
  const Icon = icon;
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-border/70 bg-card p-3 text-center">
      <Icon className="mb-1 size-4 text-brand" aria-hidden="true" />
      <span className="text-sm font-bold text-foreground">{value}</span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}

function PartyContactCard({
  roleLabel,
  roleIcon,
  person,
  locked = false,
  emptyText = "Details unavailable",
  whatsAppMessage = "",
}) {
  const RoleIcon = roleIcon;
  const waUrl = person?.phone ? toWhatsAppUrl(person.phone, whatsAppMessage) : null;

  return (
    <Card className="justify-between">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="gap-1">
            <RoleIcon className="size-3.5" aria-hidden="true" />
            <span>{roleLabel}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!person ? (
          <p className="py-4 text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <Avatar src={person.pp} name={person.username} size="default" />
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-foreground">
                  {person.username || roleLabel}
                </p>
                {locked ? (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <Lock className="size-3" aria-hidden="true" />
                    <span>Claim visit to reveal contact</span>
                  </p>
                ) : (
                  <div className="mt-0.5 space-y-0.5 text-xs text-muted-foreground selectable">
                    <p className="truncate">{person.phone || "No phone on file"}</p>
                    <p className="truncate">{person.email || "No email on file"}</p>
                  </div>
                )}
              </div>
            </div>

            {!locked && (person.phone || person.email) ? (
              <div className="grid grid-cols-3 gap-2">
                {person.phone ? (
                  <Button variant="outline" size="sm" asChild className="px-2">
                    <a href={`tel:${person.phone}`} aria-label={`Call ${person.username || roleLabel}`}>
                      <Phone className="size-3.5 text-success" aria-hidden="true" />
                      <span>Call</span>
                    </a>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled className="px-2">
                    <Phone className="size-3.5" aria-hidden="true" />
                    <span>Call</span>
                  </Button>
                )}

                {waUrl ? (
                  <Button variant="outline" size="sm" asChild className="px-2">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`WhatsApp ${person.username || roleLabel}`}
                    >
                      <MessageCircle className="size-3.5 text-success" aria-hidden="true" />
                      <span>WhatsApp</span>
                    </a>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled className="px-2">
                    <MessageCircle className="size-3.5" aria-hidden="true" />
                    <span>WhatsApp</span>
                  </Button>
                )}

                {person.email ? (
                  <Button variant="outline" size="sm" asChild className="px-2">
                    <a href={`mailto:${person.email}`} aria-label={`Email ${person.username || roleLabel}`}>
                      <Mail className="size-3.5 text-info" aria-hidden="true" />
                      <span>Email</span>
                    </a>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled className="px-2">
                    <Mail className="size-3.5" aria-hidden="true" />
                    <span>Email</span>
                  </Button>
                )}
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
