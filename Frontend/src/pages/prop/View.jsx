import React, { useContext, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  Bookmark,
  Share2,
  MapPin,
  Building2,
  Edit3,
  Plus,
  Trash2,
} from "lucide-react";

import { AppContext } from "../../contexts/AppContext";
import api from "../../api/client";
import { requestVisit } from "../../api/visits";
import Recommend from "../../components/Recomended";
import PropertyShareSheet from "../../components/PropertyShareSheet";
import { MediaGallery } from "@/components/ui/media-gallery";
import { Button } from "@/components/ui/button";
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

  // Visit request state
  const [visitSheetOpen, setVisitSheetOpen] = useState(false);
  const [slots, setSlots] = useState(() => [defaultTomorrowSlot(26)]);
  const [visitNote, setVisitNote] = useState("");
  const [visitError, setVisitError] = useState("");
  const [visitSubmitting, setVisitSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await api.post("/api/fetching/get-property", { _id: id });
        if (!cancelled) {
          setProperty(res?.status === 200 && res.data?.Property?._id ? res.data.Property : null);
        }
      } catch {
        if (!cancelled) setProperty(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const isSaved = Boolean(user?.saved?.some((s) => String(s?.propId) === String(id)));
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
      navigate("/signin", { state: { from: location } });
      return;
    }
    const nextAction = !isSaved;
    try {
      setSaveBusy(true);
      const res = await api.post("/api/booking/save-property", { id, action: nextAction });
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
      }
    } finally {
      setSaveBusy(false);
    }
  };

  const openVisitSheet = () => {
    if (!user?._id) {
      navigate("/signin", { state: { from: location } });
      return;
    }
    setVisitError("");
    setVisitSheetOpen(true);
  };

  const handleSubmitVisit = async (e) => {
    e?.preventDefault();
    setVisitError("");
    const validIso = [];
    const now = Date.now();
    for (const raw of slots) {
      if (!raw) continue;
      const d = new Date(raw);
      if (Number.isNaN(d.getTime()) || d.getTime() <= now + 5 * 60 * 1000) {
        setVisitError("Choose a future date and time.");
        return;
      }
      validIso.push(d.toISOString());
    }
    if (validIso.length === 0) {
      setVisitError("Choose a date and time.");
      return;
    }

    try {
      setVisitSubmitting(true);
      const data = await requestVisit({
        propId: id,
        preferredSlots: validIso.slice(0, 3),
        note: visitNote.trim(),
      });
      setVisitSheetOpen(false);
      refreshUser?.();
      toast({ title: "Visit requested", variant: "success" });
      navigate(data?.visit?._id ? `/visits/${data.visit._id}` : "/visits");
    } catch (err) {
      setVisitError(err.response?.data?.message || "Could not request visit.");
    } finally {
      setVisitSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-6 py-4">
        <Skeleton className="aspect-[16/9] w-full rounded-3xl" />
        <Skeleton className="h-7 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    );
  }

  if (!property?._id) {
    return (
      <EmptyState
        icon={Building2}
        title="Listing unavailable"
        action={
          <Button asChild size="sm" className="rounded-full px-5">
            <Link to="/">Back home</Link>
          </Button>
        }
      />
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
  const description = property.description || "";
  const isLongDesc = description.length > 220;

  const specs = [isRent ? "For Rent" : "For Sale"];
  if (property.propertyType) specs.push(property.propertyType);
  if (property.propertyType !== "Plot" && Number(property.rooms) > 0) {
    specs.push(`${property.rooms} Rooms`);
  }
  if (property.propertyType !== "Plot" && Number(property.washrooms) > 0) {
    specs.push(`${property.washrooms} Baths`);
  }
  if (Number(property.area) > 0) {
    specs.push(`${property.area} sq.ft`);
  }

  const renderActions = () => {
    if (isOwner) {
      return (
        <div className="flex flex-1 gap-2">
          <Button asChild className="flex-1 rounded-full">
            <Link to={`/my/${property._id}`}>Manage</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full px-4">
            <Link to={`/edit-property/${property._id}`}>
              <Edit3 className="size-4" aria-hidden="true" />
              <span>Edit</span>
            </Link>
          </Button>
        </div>
      );
    }

    if (myBooking) {
      if (myBooking.bType === "visit") {
        return (
          <div className="flex flex-1 items-center justify-between gap-3">
            <VisitStatusPill status={myBooking.visitStatus || "requested"} />
            <Button asChild className="rounded-full px-5">
              <Link to={`/visits/${myBooking._id}`}>View visit</Link>
            </Button>
          </div>
        );
      }
      return (
        <Button asChild className="flex-1 rounded-full">
          <Link to={`/booked/${property._id}`}>View booking</Link>
        </Button>
      );
    }

    return (
      <div className="flex flex-1 gap-2">
        <Button onClick={openVisitSheet} className="flex-1 rounded-full">
          Schedule visit
        </Button>
        <Button asChild variant="outline" className="rounded-full px-5">
          <Link to={`/book/${property._id}/${property.price}`}>Book</Link>
        </Button>
      </div>
    );
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-7 py-4 pb-28 sm:py-6 lg:pb-12">
      {/* Minimal Top Bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="inline-flex size-9 items-center justify-center rounded-full border border-border hover:bg-accent"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={saveBusy}
            onClick={handleSave}
            aria-label={isSaved ? "Unsave" : "Save"}
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-full border transition-colors",
              isSaved
                ? "border-foreground bg-foreground text-background"
                : "border-border hover:bg-accent",
            )}
          >
            <Bookmark className={cn("size-4", isSaved && "fill-current")} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            aria-label="Share"
            className="inline-flex size-9 items-center justify-center rounded-full border border-border hover:bg-accent"
          >
            <Share2 className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Video First + Photo Gallery */}
      <div className="-mx-4 sm:mx-0">
        <MediaGallery
          images={images}
          video={property.video}
          title={property.title || "Property"}
        />
      </div>

      {/* Calm Two-Column Content */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_320px]">
        <div className="flex min-w-0 flex-col gap-6">
          {/* Title, Location & Compact Specs */}
          <div className="space-y-2 border-b border-border/60 pb-5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {property.title}
            </h1>

            {property.location ? (
              <a
                href={buildMapsUrl(property.location)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                <span>{property.location}</span>
              </a>
            ) : null}

            <p className="pt-1 text-sm font-medium text-foreground/85">
              {specs.join("  ·  ")}
            </p>
          </div>

          {/* Description */}
          {description ? (
            <div className="space-y-2 border-b border-border/60 pb-5">
              <p
                className={cn(
                  "selectable whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground",
                  !expandedDesc && isLongDesc && "line-clamp-3",
                )}
              >
                {description}
              </p>
              {isLongDesc ? (
                <button
                  type="button"
                  onClick={() => setExpandedDesc((v) => !v)}
                  className="text-xs font-semibold text-foreground underline underline-offset-4"
                >
                  {expandedDesc ? "Less" : "More"}
                </button>
              ) : null}
            </div>
          ) : null}

          {/* Amenities */}
          {amenities.length > 0 ? (
            <div className="flex flex-wrap gap-2 border-b border-border/60 pb-5">
              {amenities.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground"
                >
                  {item}
                </span>
              ))}
            </div>
          ) : null}

          {/* Host */}
          {property.ownerInfo ? (
            <div className="flex items-center gap-3">
              <Avatar
                src={property.ownerInfo.pp}
                name={property.ownerInfo.username || "Owner"}
                size="sm"
              />
              <div className="min-w-0 text-sm">
                <span className="text-muted-foreground">Hosted by </span>
                <strong className="font-semibold text-foreground">
                  {property.ownerInfo.username || "Owner"}
                </strong>
              </div>
            </div>
          ) : null}
        </div>

        {/* Desktop Sticky Action Box */}
        <aside className="hidden rounded-2xl border border-border p-5 lg:sticky lg:top-24 lg:flex lg:flex-col lg:gap-4">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold tabular-nums text-foreground">
              {formatPrice(property.price)}
            </span>
            {isRent ? <span className="text-sm text-muted-foreground">/mo</span> : null}
          </div>
          {myBooking?.schedule?.startAt ? (
            <p className="text-xs text-muted-foreground">
              Scheduled: {formatVisitDate(myBooking.schedule.startAt)}
            </p>
          ) : null}
          {renderActions()}
        </aside>
      </div>

      {/* Similar Listings */}
      <section className="border-t border-border/60 pt-7">
        <h2 className="mb-5 text-lg font-bold tracking-tight text-foreground">
          More listings
        </h2>
        <Recommend id={property._id} />
      </section>

      {/* Mobile Bottom Action Bar */}
      <div className="chrome-fixed-bottom glass fixed inset-x-0 bottom-0 z-40 border-t border-border/70 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] lg:hidden">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-4">
          <div className="shrink-0">
            <span className="text-base font-bold tabular-nums text-foreground">
              {formatPrice(property.price)}
            </span>
            {isRent ? <span className="text-xs text-muted-foreground">/mo</span> : null}
          </div>
          {renderActions()}
        </div>
      </div>

      <PropertyShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        propertyId={property._id}
        propertyTitle={property.title || "Property"}
      />

      {/* Minimal Schedule Visit Sheet */}
      <Sheet
        open={visitSheetOpen}
        onOpenChange={setVisitSheetOpen}
        title="Schedule a visit"
        footer={
          <Button
            loading={visitSubmitting}
            onClick={handleSubmitVisit}
            className="w-full rounded-full sm:w-auto"
          >
            Request visit
          </Button>
        }
      >
        <form onSubmit={handleSubmitVisit} className="flex flex-col gap-4">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">
                Preferred time
              </span>
              {slots.length < 3 ? (
                <button
                  type="button"
                  onClick={() =>
                    setSlots((prev) => [
                      ...prev,
                      defaultTomorrowSlot(26 + prev.length * 24),
                    ])
                  }
                  className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  <span>Add option</span>
                </button>
              ) : null}
            </div>

            {slots.map((slot, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  type="datetime-local"
                  value={slot}
                  min={minLocalDateTime()}
                  onChange={(e) => {
                    setVisitError("");
                    setSlots((prev) =>
                      prev.map((s, i) => (i === idx ? e.target.value : s)),
                    );
                  }}
                  aria-label={`Option ${idx + 1}`}
                  required={idx === 0}
                />
                {slots.length > 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setSlots((prev) => prev.filter((_, i) => i !== idx))
                    }
                    aria-label="Remove option"
                    className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            ))}
          </div>

          <Field label="Note (optional)">
            <Textarea
              rows={2}
              value={visitNote}
              onChange={(e) => setVisitNote(e.target.value)}
              placeholder="Any message for the owner or broker"
            />
          </Field>

          {visitError ? (
            <p role="alert" className="text-xs font-medium text-destructive">
              {visitError}
            </p>
          ) : null}
        </form>
      </Sheet>
    </div>
  );
};

export default View;
