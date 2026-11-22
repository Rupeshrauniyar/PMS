import React from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  CalendarClock,
  Clock,
  Film,
  BedDouble,
  Bath,
  Maximize2,
  User,
  Building2,
  Briefcase,
  ChevronRight,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { formatPrice, timeAgo } from "@/lib/format";
import { formatVisitDate, formatVisitTimeRange } from "@/lib/visit";
import { Badge } from "@/components/ui/badge";
import { VisitStatusPill } from "@/components/ui/visit-status";

/**
 * Reusable broker VisitCard for My Visits, All Visits, and Dashboard sections.
 */
export function VisitCard({
  visit,
  showBroker = false,
  actions,
  className,
}) {
  const prop = visit?.property || {};
  const cover = prop.images?.[0] || prop.video?.thumbnail || "";
  const hasVideo = Boolean(prop.video?.url);
  const startAt = visit?.schedule?.startAt;
  const preferred = visit?.preferredSlots || [];

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl border border-border/75 bg-card text-card-foreground shadow-soft transition-shadow hover:shadow-card sm:flex-row",
        className,
      )}
    >
      {/* Thumbnail */}
      <Link
        to={`/visits/${visit._id}`}
        className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-muted sm:aspect-auto sm:w-52 md:w-60"
      >
        {cover ? (
          <img
            src={cover}
            alt={prop.title || "Property"}
            width={480}
            height={320}
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-1.5 text-muted-foreground">
            <Building2 className="size-7 opacity-55" aria-hidden="true" />
            <span className="text-xs font-medium">No cover image</span>
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5">
          {hasVideo ? (
            <Badge variant="glass" className="gap-1">
              <Film className="size-3.5 text-brand" aria-hidden="true" />
              <span>Video tour</span>
            </Badge>
          ) : null}
        </div>

        <div className="absolute bottom-3 left-3">
          <span className="inline-flex items-center rounded-lg bg-black/65 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-md">
            {formatPrice(prop.price ?? visit.price)}
          </span>
        </div>
      </Link>

      {/* Body */}
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3.5 p-4 sm:p-5">
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <Link
                to={`/visits/${visit._id}`}
                className="inline-flex items-center gap-1 text-base font-bold tracking-tight text-foreground hover:text-brand"
              >
                <span className="line-clamp-1">{prop.title || "Untitled Property"}</span>
                <ChevronRight className="size-4 shrink-0 opacity-60" aria-hidden="true" />
              </Link>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="line-clamp-1">{prop.location || "Location on request"}</span>
              </p>
            </div>
            <VisitStatusPill status={visit.visitStatus} />
          </div>

          {/* Property quick specs */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {prop.propertyType ? (
              <span className="rounded-md bg-muted px-2 py-0.5 font-medium text-foreground/85">
                {prop.propertyType}
              </span>
            ) : null}
            {prop.rooms ? (
              <span className="inline-flex items-center gap-1">
                <BedDouble className="size-3.5" aria-hidden="true" />
                {prop.rooms}
              </span>
            ) : null}
            {prop.washrooms ? (
              <span className="inline-flex items-center gap-1">
                <Bath className="size-3.5" aria-hidden="true" />
                {prop.washrooms}
              </span>
            ) : null}
            {prop.area ? (
              <span className="inline-flex items-center gap-1">
                <Maximize2 className="size-3.5" aria-hidden="true" />
                {prop.area}
              </span>
            ) : null}
            {visit.updatedAt ? (
              <span className="ml-auto text-[11px] text-muted-foreground">
                Updated {timeAgo(visit.updatedAt)}
              </span>
            ) : null}
          </div>

          {/* Schedule or preferred slots banner */}
          {startAt ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-success/25 bg-success-soft/45 px-3.5 py-2.5 text-xs">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <CalendarClock className="size-4 shrink-0 text-success" aria-hidden="true" />
                <span>{formatVisitDate(startAt)}</span>
                <span className="text-muted-foreground">
                  · {formatVisitTimeRange(startAt, visit.schedule?.durationMin)}
                </span>
              </div>
              {visit.schedule?.meetingPoint ? (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                  <span className="line-clamp-1">{visit.schedule.meetingPoint}</span>
                </span>
              ) : null}
            </div>
          ) : preferred.length > 0 ? (
            <div className="rounded-2xl border border-brand/20 bg-brand-soft/40 px-3.5 py-2.5 text-xs">
              <p className="mb-1 flex items-center gap-1.5 font-semibold text-foreground">
                <Clock className="size-3.5 text-brand" aria-hidden="true" />
                <span>Buyer&apos;s preferred slots</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {preferred.slice(0, 3).map((slot, idx) => (
                  <span
                    key={`${slot}-${idx}`}
                    className="rounded-lg border border-border/70 bg-card px-2 py-0.5 text-[11px] font-medium text-foreground"
                  >
                    {formatVisitDate(slot)}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Parties + Actions footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <User className="size-3.5 text-brand" aria-hidden="true" />
              <span>Buyer:</span>
              <strong className="font-semibold text-foreground">
                {visit.buyer?.username || "Buyer"}
              </strong>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="size-3.5 text-info" aria-hidden="true" />
              <span>Owner:</span>
              <strong className="font-semibold text-foreground">
                {visit.owner?.username || "Owner"}
              </strong>
            </span>
            {showBroker ? (
              <span className="inline-flex items-center gap-1.5">
                <Briefcase className="size-3.5 text-success" aria-hidden="true" />
                <span>Broker:</span>
                <strong className="font-semibold text-foreground">
                  {visit.broker?.username || "Unassigned"}
                </strong>
              </span>
            ) : null}
          </div>

          {actions ? (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
