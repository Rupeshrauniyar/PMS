import React, { useContext, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bookmark,
  Share2,
  ChevronLeft,
  ChevronRight,
  Play,
  Building2,
} from "lucide-react";

import PropertyShareSheet from "./PropertyShareSheet";
import { AppContext } from "../contexts/AppContext";
import api from "../api/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { formatPrice, formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Frameless editorial skeleton — zero boxed card borders.
 */
export function PropertyCardSkeleton({ className }) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <Skeleton className="aspect-[16/10] w-full rounded-2xl" />
      <div className="flex items-center justify-between gap-4 pt-0.5">
        <Skeleton className="h-4 w-3/5 rounded-md" />
        <Skeleton className="h-4 w-24 rounded-md" />
      </div>
      <Skeleton className="h-3.5 w-2/5 rounded-md" />
      <Skeleton className="h-3.5 w-1/2 rounded-md" />
    </div>
  );
}

/**
 * Frameless Architectural Listing Showcase:
 * - No outer card box, no card border, no drop-shadow clutter.
 * - Cinematic 16:10 rounded-2xl media stage with inline swipeable photos,
 *   silent hover/tap video tour preview, and minimal monochrome controls.
 * - Clean, open editorial typography underneath.
 */
const Properties = ({ prop, className, linkTo }) => {
  const { user, setUser } = useContext(AppContext);
  const { toast } = useToast();
  const [shareOpen, setShareOpen] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [slideIdx, setSlideIdx] = useState(0);
  const [imgFailed, setImgFailed] = useState(false);
  const [previewVideo, setPreviewVideo] = useState(false);
  const touchStartX = useRef(null);

  if (!prop?._id) return null;

  const isOwner = Boolean(
    user?.myProperties?.some((m) => String(m?.propId) === String(prop._id)),
  );
  const isSaved = Boolean(
    user?.saved?.some((s) => String(s?.propId) === String(prop._id)),
  );
  const hasVideo = Boolean(prop?.video?.url);

  const images = Array.isArray(prop.images) ? prop.images.filter(Boolean) : [];
  const slides = images.length > 0
    ? images
    : prop?.video?.thumbnail
      ? [prop.video.thumbnail]
      : [];

  const totalSlides = slides.length;
  const activeImg = slides[slideIdx] || slides[0] || "";

  const destination = linkTo || `/view/${prop._id}`;
  const isRent = prop.sellingType === "Rent System";

  const stepSlide = (e, delta) => {
    e.preventDefault();
    e.stopPropagation();
    if (totalSlides <= 1) return;
    setPreviewVideo(false);
    setSlideIdx((i) => (i + delta + totalSlides) % totalSlides);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user?._id) {
      toast({
        title: "Sign in required",
        description: "Sign in to save properties.",
      });
      return;
    }
    const nextAction = !isSaved;
    try {
      setSaveBusy(true);
      const res = await api.post("/api/booking/save-property", {
        id: prop._id,
        action: nextAction,
      });
      if (res.status === 200) {
        setUser((prev) => {
          if (!prev) return prev;
          const nextSaved = nextAction
            ? [...(prev.saved || []), { propId: prop._id, createdAt: Date.now() }]
            : (prev.saved || []).filter(
                (s) => String(s?.propId) !== String(prop._id),
              );
          const updated = { ...prev, saved: nextSaved };
          try {
            localStorage.setItem("user", JSON.stringify(updated));
          } catch {
            /* ignore */
          }
          return updated;
        });
        toast({
          title: nextAction ? "Saved" : "Removed from saved",
        });
      }
    } catch (err) {
      toast({
        title: "Could not update saved list",
        description: err.response?.data?.message || "Please try again.",
        variant: "error",
      });
    } finally {
      setSaveBusy(false);
    }
  };

  // Build crisp inline architectural spec items
  const specs = [];
  if (prop.propertyType) specs.push(prop.propertyType);
  if (prop.propertyType !== "Plot" && Number(prop.rooms) > 0) {
    specs.push(`${prop.rooms} ${Number(prop.rooms) === 1 ? "Room" : "Rooms"}`);
  }
  if (prop.propertyType !== "Plot" && Number(prop.washrooms) > 0) {
    specs.push(`${prop.washrooms} ${Number(prop.washrooms) === 1 ? "Bath" : "Baths"}`);
  }
  if (Number(prop.area) > 0) {
    specs.push(`${prop.area} sq.ft`);
  }

  return (
    <>
      <article
        className={cn("group flex flex-col gap-3", className)}
        onMouseEnter={() => {
          if (hasVideo) setPreviewVideo(true);
        }}
        onMouseLeave={() => {
          if (hasVideo) setPreviewVideo(false);
        }}
      >
        {/* Frameless 16:10 Media Stage */}
        <div
          className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-muted ring-1 ring-border/40"
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current == null || totalSlides <= 1) return;
            const dx =
              (e.changedTouches[0]?.clientX ?? touchStartX.current) -
              touchStartX.current;
            touchStartX.current = null;
            if (Math.abs(dx) > 40) {
              setPreviewVideo(false);
              setSlideIdx((i) => (i + (dx < 0 ? 1 : -1) + totalSlides) % totalSlides);
            }
          }}
        >
          <Link
            to={destination}
            aria-label={prop.title || "View property"}
            className="block size-full focus-visible:outline-none"
          >
            {hasVideo && previewVideo ? (
              <video
                src={prop.video.url}
                poster={activeImg || undefined}
                width={640}
                height={400}
                autoPlay
                muted
                loop
                playsInline
                className="size-full object-cover"
              />
            ) : activeImg && !imgFailed ? (
              <img
                src={activeImg}
                alt={prop.title || "Property"}
                width={640}
                height={400}
                loading="lazy"
                onError={() => setImgFailed(true)}
                className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-1.5 text-muted-foreground">
                <Building2 className="size-7 opacity-40" aria-hidden="true" />
                <span className="text-xs font-medium">No image</span>
              </div>
            )}

            {/* Subtle bottom vignette only for dot legibility */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent opacity-80"
            />
          </Link>

          {/* Top-left Monochrome Pill */}
          <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5">
            <span className="inline-flex items-center rounded-full bg-black/65 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white backdrop-blur-md">
              {isRent ? "Rent" : "Sale"}
            </span>
            {isOwner ? (
              <span className="inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-black backdrop-blur-md">
                Yours
              </span>
            ) : null}
          </div>

          {/* Top-right Minimal Action Triggers */}
          <div className="absolute right-3 top-3 flex items-center gap-1.5">
            <button
              type="button"
              disabled={saveBusy}
              onClick={handleSave}
              aria-label={isSaved ? "Unsave listing" : "Save listing"}
              aria-pressed={isSaved}
              className={cn(
                "inline-flex size-8 items-center justify-center rounded-full backdrop-blur-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:opacity-50",
                isSaved
                  ? "bg-white text-black shadow-soft"
                  : "bg-black/45 text-white hover:bg-black/70",
              )}
            >
              <Bookmark
                className={cn("size-3.5", isSaved && "fill-current")}
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShareOpen(true);
              }}
              aria-label="Share listing"
              className="inline-flex size-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <Share2 className="size-3.5" aria-hidden="true" />
            </button>
          </div>

          {/* Prev / Next Photo Arrows on Desktop Hover */}
          {totalSlides > 1 ? (
            <>
              <button
                type="button"
                onClick={(e) => stepSlide(e, -1)}
                aria-label="Previous photo"
                className="absolute left-2.5 top-1/2 hidden size-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black opacity-0 shadow-soft transition-opacity hover:bg-white group-hover:opacity-100 sm:inline-flex"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={(e) => stepSlide(e, 1)}
                aria-label="Next photo"
                className="absolute right-2.5 top-1/2 hidden size-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black opacity-0 shadow-soft transition-opacity hover:bg-white group-hover:opacity-100 sm:inline-flex"
              >
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            </>
          ) : null}

          {/* Bottom-left Video Tour Toggle / Indicator */}
          {hasVideo ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setPreviewVideo((v) => !v);
              }}
              aria-label={previewVideo ? "Show photo" : "Preview video tour"}
              className="absolute bottom-2.5 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-[10.5px] font-semibold tracking-wide text-white ring-1 ring-white/15 backdrop-blur-md transition hover:bg-black"
            >
              <Play className="size-2.5 fill-current" aria-hidden="true" />
              <span>
                {previewVideo
                  ? "Playing"
                  : `Tour${prop?.video?.duration ? ` · ${formatDuration(prop.video.duration)}` : ""}`}
              </span>
            </button>
          ) : null}

          {/* Bottom-center Minimal Slide Dots */}
          {totalSlides > 1 && !previewVideo ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1"
            >
              {slides.slice(0, 6).map((_, idx) => (
                <span
                  key={idx}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    idx === slideIdx % Math.min(totalSlides, 6)
                      ? "w-3.5 bg-white"
                      : "w-1.5 bg-white/50",
                  )}
                />
              ))}
            </div>
          ) : null}
        </div>

        {/* Open Editorial Typography (No Card Box) */}
        <Link
          to={isOwner ? `/my/${prop._id}` : destination}
          className="flex flex-col gap-0.5 px-0.5 focus-visible:outline-none"
        >
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="truncate text-[15.5px] font-semibold tracking-[-0.015em] text-foreground">
              {prop.title || "Untitled residence"}
            </h3>
            <p className="shrink-0 text-[15px] font-bold tracking-tight text-foreground tabular-nums">
              {formatPrice(prop.price)}
              {isRent ? (
                <span className="text-xs font-normal text-muted-foreground">
                  /mo
                </span>
              ) : null}
            </p>
          </div>

          {prop.location ? (
            <p className="truncate text-[13.5px] text-muted-foreground">
              {prop.location}
            </p>
          ) : null}

          {specs.length > 0 ? (
            <p className="mt-0.5 truncate text-[12.5px] font-medium text-muted-foreground/80">
              {specs.join("  ·  ")}
            </p>
          ) : null}
        </Link>
      </article>

      <PropertyShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        propertyId={prop._id}
        propertyTitle={prop.title || "Property"}
      />
    </>
  );
};

export default Properties;
