import React, { useState } from "react";
import { MapPin, Bed, Bath, Ruler, ChevronDown } from "lucide-react";

import { MediaGallery } from "@/components/ui/media-gallery";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

const ExtendedProperty = ({ props: prop, price }) => {
  const [expanded, setExpanded] = useState(false);

  if (!prop?._id) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Property details unavailable.
      </p>
    );
  }

  const description = prop.description || "";
  const isLong = description.length > 160;
  const hasBargain =
    price != null && Number(price) > 0 && Number(price) !== Number(prop.price);

  return (
    <div className="flex flex-col gap-5">
      <MediaGallery
        images={prop.images || []}
        video={prop.video || null}
        title={prop.title || "Property"}
      />

      <div className="flex flex-col gap-2.5">
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

        <h2 className="text-xl font-bold tracking-tight text-foreground">
          {prop.title}
        </h2>

        <div className="flex flex-wrap items-baseline gap-2">
          {hasBargain ? (
            <>
              <span className="text-sm text-muted-foreground line-through tabular-nums">
                {formatPrice(prop.price)}
              </span>
              <span className="text-xl font-extrabold text-brand tabular-nums">
                {formatPrice(price)}
              </span>
              <Badge variant="brand">Negotiated</Badge>
            </>
          ) : (
            <span className="text-xl font-extrabold text-foreground tabular-nums">
              {formatPrice(prop.price)}
            </span>
          )}
        </div>

        {description ? (
          <div>
            <p
              className={cn(
                "selectable text-sm leading-relaxed text-muted-foreground",
                !expanded && isLong && "line-clamp-3",
              )}
            >
              {description}
            </p>
            {isLong ? (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
              >
                <span>{expanded ? "Show less" : "Read more"}</span>
                <ChevronDown
                  className={cn("size-3.5 transition-transform", expanded && "rotate-180")}
                  aria-hidden="true"
                />
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2.5 pt-2 sm:grid-cols-4">
          {prop.propertyType !== "Plot" ? (
            <>
              <div className="rounded-xl border border-border/70 bg-muted/35 p-3">
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Bed className="size-3.5" aria-hidden="true" />
                  <span>Rooms</span>
                </p>
                <p className="mt-0.5 text-sm font-bold text-foreground">
                  {prop.rooms ?? 0}
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-muted/35 p-3">
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Bath className="size-3.5" aria-hidden="true" />
                  <span>Washrooms</span>
                </p>
                <p className="mt-0.5 text-sm font-bold text-foreground">
                  {prop.washrooms ?? 0}
                </p>
              </div>
            </>
          ) : null}

          {Number(prop.area) > 0 ? (
            <div className="rounded-xl border border-border/70 bg-muted/35 p-3">
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Ruler className="size-3.5" aria-hidden="true" />
                <span>Area</span>
              </p>
              <p className="mt-0.5 text-sm font-bold text-foreground">
                {prop.area} sq.ft
              </p>
            </div>
          ) : null}

          {prop.location ? (
            <div className="rounded-xl border border-border/70 bg-muted/35 p-3">
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3.5" aria-hidden="true" />
                <span>Location</span>
              </p>
              <p className="mt-0.5 truncate text-sm font-bold text-foreground">
                {prop.location}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ExtendedProperty;
