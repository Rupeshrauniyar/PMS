import React, { useContext, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Play,
  Building2,
} from "lucide-react";

import { AppContext } from "../contexts/AppContext";
import api from "../api/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PropertyCardSkeleton({ className }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2.5", className)}>
      <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <Skeleton className="h-4 w-24 rounded-md" />
        <Skeleton className="h-4 w-12 rounded-full" />
      </div>
      <Skeleton className="h-4 w-4/5 rounded-md" />
      <Skeleton className="h-3.5 w-3/5 rounded-md" />
    </div>
  );
}

const Properties = ({ prop, className, linkTo }) => {
  const { user, setUser } = useContext(AppContext);
  const { toast } = useToast();
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
  const isBooked = Boolean(prop?.status);

  const images = Array.isArray(prop.images) ? prop.images.filter(Boolean) : [];
  const slides =
    images.length > 0
      ? images
      : prop?.video?.thumbnail
        ? [prop.video.thumbnail]
        : [];

  const totalSlides = slides.length;
  const activeImg = slides[slideIdx] || slides[0] || "";

  const destination = linkTo || (isOwner ? `/my/${prop._id}` : `/view/${prop._id}`);
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
      toast({ title: "Sign in to save listings" });
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
      }
    } catch {
      toast({ title: "Could not save", variant: "error" });
    } finally {
      setSaveBusy(false);
    }
  };

  const metaParts = [];
  if (prop.location) metaParts.push(prop.location);
  if (prop.propertyType !== "Plot" && Number(prop.rooms) > 0) {
    metaParts.push(`${prop.rooms} ${Number(prop.rooms) === 1 ? "Room" : "Rooms"}`);
  } else if (prop.area) {
    metaParts.push(`${prop.area}`);
  }

  return (
    <article
      className={cn("group flex min-w-0 flex-col gap-2.5", className)}
      onMouseEnter={() => {
        if (hasVideo && !isBooked) setPreviewVideo(true);
      }}
      onMouseLeave={() => {
        if (hasVideo) setPreviewVideo(false);
      }}
    >
      {/* 4:3 Architectural Media Frame */}
      <div
        className="relative aspect-[4/3] w-full overflow-clip rounded-2xl border border-border/50 bg-muted"
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
              height={480}
              autoPlay
              muted
              loop
              playsInline
              className="block size-full object-cover"
            />
          ) : activeImg && !imgFailed ? (
            <img
              src={activeImg}
              alt={prop.title || "Property"}
              width={640}
              height={480}
              loading="lazy"
              onError={() => setImgFailed(true)}
              className={cn(
                "block size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]",
                isBooked && "opacity-85",
              )}
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <Building2 className="size-6 opacity-35" aria-hidden="true" />
            </div>
          )}
        </Link>

        {/* Top-left Status / Video Micro-Pill */}
        {isBooked ? (
          <span className="pointer-events-none absolute left-2.5 top-2.5 inline-flex items-center rounded-full bg-black/80 px-2.5 py-0.5 text-[10.5px] font-bold tracking-tight text-white backdrop-blur-md">
            Booked
          </span>
        ) : hasVideo ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setPreviewVideo((v) => !v);
            }}
            aria-label="Preview walkthrough video"
            className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-black/65 px-2.5 py-1 text-[10.5px] font-semibold text-white backdrop-blur-md transition hover:bg-black/80"
          >
            <Play className="size-2.5 fill-current" aria-hidden="true" />
            <span>Tour</span>
          </button>
        ) : null}

        {/* Save Button */}
        <button
          type="button"
          disabled={saveBusy}
          onClick={handleSave}
          aria-label={isSaved ? "Unsave" : "Save"}
          aria-pressed={isSaved}
          className={cn(
            "absolute right-2.5 top-2.5 inline-flex size-8 items-center justify-center rounded-full backdrop-blur-md transition",
            isSaved
              ? "bg-white text-black shadow-sm"
              : "bg-black/40 text-white hover:bg-black/65",
          )}
        >
          <Bookmark
            className={cn("size-3.5", isSaved && "fill-current")}
            aria-hidden="true"
          />
        </button>

        {/* Hover Photo Arrows */}
        {totalSlides > 1 ? (
          <>
            <button
              type="button"
              onClick={(e) => stepSlide(e, -1)}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 hidden size-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black opacity-0 shadow-sm transition-opacity group-hover:opacity-100 sm:inline-flex"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={(e) => stepSlide(e, 1)}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 hidden size-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black opacity-0 shadow-sm transition-opacity group-hover:opacity-100 sm:inline-flex"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </>
        ) : null}

        {/* Minimal Slide Dots */}
        {totalSlides > 1 && !previewVideo ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1"
          >
            {slides.slice(0, 5).map((_, idx) => (
              <span
                key={idx}
                className={cn(
                  "size-1.5 rounded-full transition-opacity",
                  idx === slideIdx % Math.min(totalSlides, 5)
                    ? "bg-white"
                    : "bg-white/45",
                )}
              />
            ))}
          </div>
        ) : null}
      </div>

      {/* Crisp 3-Line Architectural Metadata */}
      <Link to={destination} className="flex min-w-0 flex-col gap-0.5 px-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[14.5px] font-extrabold tabular-nums tracking-tight text-foreground sm:text-[15.5px]">
            {formatPrice(prop.price)}
            {isRent ? (
              <span className="text-[11.5px] font-medium text-muted-foreground"> /mo</span>
            ) : null}
          </span>

          {prop.propertyType ? (
            <span className="shrink-0 rounded-md border border-border/80 bg-secondary/50 px-1.5 py-0.5 text-[10.5px] font-semibold text-foreground/85">
              {prop.propertyType}
            </span>
          ) : null}
        </div>

        <h3 className="truncate text-[13.5px] font-semibold text-foreground sm:text-[14.5px]">
          {prop.title || "Untitled property"}
        </h3>

        <p className="truncate text-xs text-muted-foreground">
          {metaParts.join(" · ") || (isRent ? "For Rent" : "For Sale")}
        </p>
      </Link>
    </article>
  );
};

export default Properties;
