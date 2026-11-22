import React, { useContext, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  Bookmark,
  Share2,
  MapPin,
  Building2,
  Eye,
  CalendarCheck,
  CreditCard,
  Edit3,
  Settings2,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Film,
  ChevronDown,
} from "lucide-react";

import { AppContext } from "../../contexts/AppContext";
import api from "../../api/client";
import { requestVisit } from "../../api/visits";
import Recommend from "../../components/Recomended";
import PropertyShareSheet from "../../components/PropertyShareSheet";
import { MediaGallery } from "@/components/ui/media-gallery";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet } from "@/components/ui/sheet";
import { Input, Textarea, Field } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { VisitStatusPill } from "@/components/ui/visit-status";
import { useToast } from "@/components/ui/toast";
import { formatPrice } from "@/lib/format";
import { buildMapsUrl, formatVisitDate } from "@/lib/visit";
import { cn } from "@/lib/utils";

function defaultTomorrowSlot(hoursOffset = 24) {
  const d = new Date(Date.now() + hoursOffset * 3600 * 1000);
  d.setMinutes(0, 0, 0);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function minLocalDateTime() {
  const d = new Date(Date.now() + 15 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const View = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser, refreshUser } = useContext(AppContext);
  const { toast } = useToast();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [expandedDesc, setExpandedDesc] = useState(false);

  // Request site visit Sheet state
  const [visitSheetOpen, setVisitSheetOpen] = useState(false);
  const [slots, setSlots] = useState(() => [defaultTomorrowSlot(26)]);
  const [visitNote, setVisitNote] = useState("");
  const [visitError, setVisitError] = useState("");
  const [visitSubmitting, setVisitSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadProperty = async () => {
      setLoading(true);
      try {
        const res = await api.post("/api/fetching/get-property", { _id: id });
        if (!cancelled) {
          if (res?.status === 200 && res.data?.Property?._id) {
            setProperty(res.data.Property);
          } else {
            setProperty(null);
          }
        }
      } catch {
        if (!cancelled) setProperty(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadProperty();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const isSaved = Boolean(
    user?.saved?.some((s) => String(s?.propId) === String(id)),
  );

  const isOwner = Boolean(
    property?.viewer?.isOwner ||
      user?.myProperties?.some((m) => String(m?.propId) === String(id)),
  );

  const myBooking =
    property?.viewer?.myBooking ||
    user?.bookedProperties?.find((b) => String(b?.propId) === String(id)) ||
    null;

  const handleSave = async () => {
    if (!user?._id) {
      toast({
        title: "Sign in to bookmark",
        description: "Create an account or sign in to save listings.",
      });
      navigate("/signin", { state: { from: location } });
      return;
    }
    const nextAction = !isSaved;
    try {
      setSaveBusy(true);
      const res = await api.post("/api/booking/save-property", {
        id,
        action: nextAction,
      });
      if (res.status === 200) {
        setUser((prev) => {
          if (!prev) return prev;
          const nextSaved = nextAction
            ? [...(prev.saved || []), { propId: id, createdAt: Date.now() }]
            : (prev.saved || []).filter((s) => String(s?.propId) !== String(id));
          const updated = { ...prev, saved: nextSaved };
          try {
            localStorage.setItem("user", JSON.stringify(updated));
          } catch {
            /* ignore */
          }
          return updated;
        });
        toast({
          title: nextAction ? "Saved to your bookmarks" : "Removed from bookmarks",
          variant: "success",
        });
      }
    } catch (err) {
      toast({
        title: "Could not save property",
        description: err.response?.data?.message || "Please try again.",
        variant: "error",
      });
    } finally {
      setSaveBusy(false);
    }
  };

  const openVisitSheet = () => {
    if (!user?._id) {
      toast({
        title: "Sign in required",
        description: "Sign in to request an in-person site visit.",
      });
      navigate("/signin", { state: { from: location } });
      return;
    }
    setVisitError("");
    setVisitSheetOpen(true);
  };

  const handleSlotChange = (idx, val) => {
    setVisitError("");
    setSlots((prev) => prev.map((s, i) => (i === idx ? val : s)));
  };

  const addSlot = () => {
    if (slots.length >= 3) return;
    setSlots((prev) => [...prev, defaultTomorrowSlot(26 + prev.length * 24)]);
  };

  const removeSlot = (idx) => {
    if (slots.length <= 1) return;
    setSlots((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmitVisit = async (e) => {
    e?.preventDefault();
    setVisitError("");

    const validIso = [];
    const now = Date.now();
    for (const raw of slots) {
      if (!raw) continue;
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) {
        setVisitError("Please enter valid dates and times.");
        return;
      }
      if (d.getTime() <= now + 5 * 60 * 1000) {
        setVisitError("Every preferred slot must be in the future.");
        return;
      }
      validIso.push(d.toISOString());
    }

    if (validIso.length === 0) {
      setVisitError("Select at least one preferred date and time.");
      return;
    }

    try {
      setVisitSubmitting(true);
      const data = await requestVisit({
        propId: id,
        preferredSlots: validIso.slice(0, 3),
        note: visitNote.trim(),
      });
      const newVisit = data?.visit;
      setVisitSheetOpen(false);
      refreshUser?.();
      toast({
        title: "Site visit requested!",
        description:
          "The owner has been notified. Once approved, a broker will confirm the schedule.",
        variant: "success",
      });
      if (newVisit?._id) {
        navigate(`/visits/${newVisit._id}`);
      } else {
        navigate("/visits");
      }
    } catch (err) {
      const code = err.response?.data?.code;
      const msg =
        err.response?.data?.message || "Could not submit visit request.";
      setVisitError(msg);
      toast({
        title: code === "DUPLICATE" ? "Visit already requested" : "Request failed",
        description: msg,
        variant: "error",
      });
      if (code === "DUPLICATE") {
        setVisitSheetOpen(false);
        navigate("/visits");
      }
    } finally {
      setVisitSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 py-5 sm:py-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-24 rounded-full" />
          <div className="flex gap-2">
            <Skeleton className="size-10 rounded-full" />
            <Skeleton className="size-10 rounded-full" />
          </div>
        </div>
        <Skeleton className="aspect-[16/9] w-full rounded-3xl" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-5 w-1/3" />
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="h-20 rounded-2xl" />
              <Skeleton className="h-20 rounded-2xl" />
              <Skeleton className="h-20 rounded-2xl" />
            </div>
            <Skeleton className="h-32 rounded-2xl" />
          </div>
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!property?._id) {
    return (
      <div className="py-12">
        <EmptyState
          icon={Building2}
          title="Listing not found"
          description="This property may have been removed or is no longer available."
          action={
            <Button asChild variant="brand">
              <Link to="/">Browse available properties</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const images = Array.isArray(property.images)
    ? property.images
    : property.image
      ? [property.image]
      : [];
  const isRent = property.sellingType === "Rent System";
  const amenities = Array.isArray(property.amenities)
    ? property.amenities.filter(Boolean)
    : [];
  const ownerInfo = property.ownerInfo || null;
  const description = property.description || "";
  const isLongDesc = description.length > 280;

  const renderActionButtons = (compact = false) => {
    if (isOwner) {
      return (
        <div className={cn("flex gap-2.5", compact ? "flex-1" : "flex-col")}>
          <Button asChild variant="brand" className="w-full">
            <Link to={`/my/${property._id}`}>
              <Settings2 className="size-4" aria-hidden="true" />
              <span>Manage listing</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to={`/edit-property/${property._id}`}>
              <Edit3 className="size-4" aria-hidden="true" />
              <span>Edit listing</span>
            </Link>
          </Button>
        </div>
      );
    }

    if (myBooking) {
      if (myBooking.bType === "visit") {
        return (
          <div className={cn("flex gap-2.5", compact ? "flex-1 items-center" : "flex-col")}>
            {!compact ? (
              <div className="flex flex-col gap-1.5 rounded-2xl border border-border/70 bg-muted/50 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Your visit request
                  </span>
                  <VisitStatusPill status={myBooking.visitStatus || "requested"} short />
                </div>
                {myBooking.schedule?.startAt ? (
                  <p className="text-xs font-medium text-foreground">
                    {formatVisitDate(myBooking.schedule.startAt)}
                  </p>
                ) : null}
              </div>
            ) : (
              <VisitStatusPill status={myBooking.visitStatus || "requested"} short />
            )}
            <Button asChild variant="brand" className="flex-1">
              <Link to={`/visits/${myBooking._id}`}>
                <CalendarCheck className="size-4" aria-hidden="true" />
                <span>View visit status</span>
              </Link>
            </Button>
          </div>
        );
      }

      return (
        <div className={cn("flex gap-2.5", compact ? "flex-1" : "flex-col")}>
          <Button asChild variant="brand" className="w-full">
            <Link to={`/booked/${property._id}`}>
              <CheckCircle2 className="size-4" aria-hidden="true" />
              <span>View booking</span>
            </Link>
          </Button>
        </div>
      );
    }

    return (
      <div className={cn("flex gap-2.5", compact ? "flex-1" : "flex-col")}>
        <Button
          variant="brand"
          onClick={openVisitSheet}
          className={cn(compact ? "flex-1" : "w-full")}
        >
          <CalendarCheck className="size-4" aria-hidden="true" />
          <span>Request site visit</span>
        </Button>
        <Button
          asChild
          variant="outline"
          className={cn(compact ? "shrink-0 px-3.5" : "w-full")}
        >
          <Link to={`/book/${property._id}/${property.price}`}>
            <CreditCard className="size-4" aria-hidden="true" />
            <span>{compact ? "Reserve" : "Book / Reserve"}</span>
          </Link>
        </Button>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8 py-4 pb-28 sm:py-6 lg:pb-12">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="-ml-2 gap-1.5"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          <span>Back</span>
        </Button>

        <div className="flex items-center gap-2">
          {isOwner ? (
            <Button asChild variant="outline" size="sm">
              <Link to={`/edit-property/${property._id}`}>
                <Edit3 className="size-3.5" aria-hidden="true" />
                <span>Edit</span>
              </Link>
            </Button>
          ) : null}
          <Button
            variant={isSaved ? "default" : "outline"}
            size="sm"
            disabled={saveBusy}
            onClick={handleSave}
          >
            <Bookmark
              className={cn("size-4", isSaved && "fill-current")}
              aria-hidden="true"
            />
            <span>{isSaved ? "Saved" : "Save"}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShareOpen(true)}
          >
            <Share2 className="size-4" aria-hidden="true" />
            <span>Share</span>
          </Button>
        </div>
      </div>

      {/* MediaGallery — Walkthrough Video First, Then Photos */}
      <div className="-mx-4 sm:mx-0">
        <MediaGallery
          images={images}
          video={property.video}
          title={property.title || "Property"}
        />
      </div>

      {/* Two-column Details + Sticky Booking/Visit Sidebar */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_380px]">
        {/* Left Column */}
        <div className="flex min-w-0 flex-col gap-6">
          {/* Header Badges + Title + Location */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={isRent ? "info" : "brand"}>
                {isRent ? "For Rent" : "For Sale"}
              </Badge>
              {property.propertyType ? (
                <Badge variant="secondary">{property.propertyType}</Badge>
              ) : null}
              {property.video?.url ? (
                <Badge variant="outline" className="gap-1">
                  <Film className="size-3.5 text-brand" aria-hidden="true" />
                  <span>Video tour included</span>
                </Badge>
              ) : null}
              {typeof property.views === "number" ? (
                <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-muted-foreground tabular-nums">
                  <Eye className="size-3.5" aria-hidden="true" />
                  <span>{property.views.toLocaleString()} views</span>
                </span>
              ) : null}
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              {property.title || "Property"}
            </h1>

            {property.location ? (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 font-medium text-foreground/90">
                  <MapPin className="size-4 shrink-0 text-brand" aria-hidden="true" />
                  <span>{property.location}</span>
                </span>
                <a
                  href={buildMapsUrl(property.location)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                >
                  <span>Open in Maps</span>
                  <ExternalLink className="size-3" aria-hidden="true" />
                </a>
              </div>
            ) : null}

            {/* Mobile Price Summary */}
            <div className="mt-1 flex items-baseline gap-1.5 lg:hidden">
              <span className="text-2xl font-extrabold tracking-tight text-foreground tabular-nums">
                {formatPrice(property.price)}
              </span>
              {isRent ? (
                <span className="text-sm font-medium text-muted-foreground">
                  / month
                </span>
              ) : null}
            </div>
          </div>

          {/* Architectural Key Facts Strip (No Heavy Boxes) */}
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4 border-y border-border/70 py-5">
            <div>
              <p className="text-xs text-muted-foreground">Type</p>
              <p className="mt-0.5 text-[15px] font-semibold text-foreground">
                {property.propertyType || "Residence"}
              </p>
            </div>

            {property.propertyType !== "Plot" ? (
              <>
                <div className="h-7 w-px bg-border/70" aria-hidden="true" />
                <div>
                  <p className="text-xs text-muted-foreground">Rooms</p>
                  <p className="mt-0.5 text-[15px] font-semibold text-foreground tabular-nums">
                    {property.rooms ?? 0}{" "}
                    {Number(property.rooms) === 1 ? "Room" : "Rooms"}
                  </p>
                </div>

                <div className="h-7 w-px bg-border/70" aria-hidden="true" />
                <div>
                  <p className="text-xs text-muted-foreground">Washrooms</p>
                  <p className="mt-0.5 text-[15px] font-semibold text-foreground tabular-nums">
                    {property.washrooms ?? 0}{" "}
                    {Number(property.washrooms) === 1 ? "Bath" : "Baths"}
                  </p>
                </div>
              </>
            ) : null}

            {Number(property.area) > 0 ? (
              <>
                <div className="h-7 w-px bg-border/70" aria-hidden="true" />
                <div>
                  <p className="text-xs text-muted-foreground">Area</p>
                  <p className="mt-0.5 text-[15px] font-semibold text-foreground tabular-nums">
                    {property.area} sq.ft
                  </p>
                </div>
              </>
            ) : null}
          </div>

          {/* Description */}
          {description ? (
            <div className="flex flex-col gap-2.5 border-b border-border/70 pb-6">
              <h2 className="text-base font-bold tracking-tight text-foreground">
                Overview
              </h2>
              <p
                className={cn(
                  "selectable whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground",
                  !expandedDesc && isLongDesc && "line-clamp-4",
                )}
              >
                {description}
              </p>
              {isLongDesc ? (
                <button
                  type="button"
                  onClick={() => setExpandedDesc((v) => !v)}
                  className="inline-flex items-center gap-1 self-start text-xs font-semibold text-foreground underline underline-offset-4"
                >
                  <span>{expandedDesc ? "Show less" : "Read full description"}</span>
                  <ChevronDown
                    className={cn(
                      "size-3.5 transition-transform",
                      expandedDesc && "rotate-180",
                    )}
                    aria-hidden="true"
                  />
                </button>
              ) : null}
            </div>
          ) : null}

          {/* Amenities */}
          {amenities.length > 0 ? (
            <div className="flex flex-col gap-3.5 border-b border-border/70 pb-6">
              <h2 className="text-base font-bold tracking-tight text-foreground">
                Amenities &amp; Highlights
              </h2>
              <div className="flex flex-wrap gap-2">
                {amenities.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/40 px-3.5 py-1.5 text-xs font-medium text-foreground"
                  >
                    <CheckCircle2
                      className="size-3.5 text-foreground"
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Owner Info Row */}
          {ownerInfo ? (
            <div className="flex items-center justify-between gap-4 py-1">
              <div className="flex min-w-0 items-center gap-3.5">
                <Avatar
                  src={ownerInfo.pp}
                  name={ownerInfo.username || "Owner"}
                  size="default"
                />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Listed by</p>
                  <p className="truncate text-[15px] font-semibold text-foreground">
                    {ownerInfo.username || "Verified Owner"}
                  </p>
                  {ownerInfo.memberSince ? (
                    <p className="text-xs text-muted-foreground">
                      Member since{" "}
                      {new Date(ownerInfo.memberSince).toLocaleDateString("en-IN", {
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  ) : null}
                </div>
              </div>
              <Badge variant="outline">Verified Host</Badge>
            </div>
          ) : null}
        </div>

        {/* Right Column — Desktop Sticky Sidebar */}
        <aside className="hidden lg:sticky lg:top-24 lg:block">
          <Card className="border-border/80 shadow-card">
            <CardContent className="flex flex-col gap-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {isRent ? "Monthly rent" : "Asking price"}
                </p>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
                    {formatPrice(property.price)}
                  </span>
                  {isRent ? (
                    <span className="text-sm font-medium text-muted-foreground">
                      / month
                    </span>
                  ) : null}
                </div>
              </div>

              {renderActionButtons(false)}

              <div className="rounded-2xl bg-muted/60 p-3.5 text-xs leading-relaxed text-muted-foreground">
                <p className="font-semibold text-foreground">
                  How site visits work
                </p>
                <p className="mt-1">
                  Submit up to 3 preferred time slots for free. Once the owner approves, a verified Propatyc broker coordinates the in-person visit.
                </p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* Recommended Listings */}
      <section className="border-t border-border/70 pt-8">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">
            Discover more
          </p>
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Similar Properties
          </h2>
        </div>
        <Recommend id={property._id} />
      </section>

      {/* Mobile Sticky Bottom CTA Bar */}
      <div className="chrome-fixed-bottom glass fixed inset-x-0 bottom-0 z-40 border-t border-border/80 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] lg:hidden">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
          <div className="hidden min-w-0 flex-col sm:flex">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {isRent ? "Rent" : "Price"}
            </span>
            <span className="truncate text-base font-extrabold text-foreground tabular-nums">
              {formatPrice(property.price)}
              {isRent ? "/mo" : ""}
            </span>
          </div>
          {renderActionButtons(true)}
        </div>
      </div>

      {/* Share Sheet */}
      <PropertyShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        propertyId={property._id}
        propertyTitle={property.title || "Property"}
      />

      {/* Request Site Visit Sheet */}
      <Sheet
        open={visitSheetOpen}
        onOpenChange={setVisitSheetOpen}
        title="Request a site visit"
        description={`Pick up to 3 preferred date & time slots to visit "${property.title || "this property"}".`}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setVisitSheetOpen(false)}
              disabled={visitSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="brand"
              loading={visitSubmitting}
              onClick={handleSubmitVisit}
            >
              <CalendarCheck className="size-4" aria-hidden="true" />
              <span>Send visit request</span>
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmitVisit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-foreground/90">
                Preferred date &amp; time slots ({slots.length}/3)
              </span>
              {slots.length < 3 ? (
                <button
                  type="button"
                  onClick={addSlot}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  <span>Add slot</span>
                </button>
              ) : null}
            </div>

            {slots.map((slot, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  type="datetime-local"
                  value={slot}
                  min={minLocalDateTime()}
                  onChange={(e) => handleSlotChange(idx, e.target.value)}
                  aria-label={`Preferred slot ${idx + 1}`}
                  required={idx === 0}
                />
                {slots.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeSlot(idx)}
                    aria-label={`Remove slot ${idx + 1}`}
                  >
                    <Trash2 className="size-4 text-muted-foreground" aria-hidden="true" />
                  </Button>
                ) : null}
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Giving 2–3 options helps the owner and assigned broker confirm faster.
            </p>
          </div>

          <Field
            label="Note for the owner & broker (optional)"
            hint="Questions about parking, furnishings, lease length, or directions."
          >
            <Textarea
              rows={3}
              value={visitNote}
              onChange={(e) => setVisitNote(e.target.value)}
              placeholder="e.g., Moving next month with family, available weekday mornings…"
            />
          </Field>

          {visitError ? (
            <p
              role="alert"
              className="rounded-xl border border-destructive/30 bg-danger-soft px-3.5 py-2.5 text-xs font-medium text-destructive"
            >
              {visitError}
            </p>
          ) : null}
        </form>
      </Sheet>
    </div>
  );
};

export default View;
