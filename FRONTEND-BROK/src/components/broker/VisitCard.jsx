import React from "react";
import { Link } from "react-router-dom";
import { Building2, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import { formatVisitDate } from "@/lib/visit";
import { VisitStatusPill } from "@/components/ui/visit-status";

export function VisitCard({ visit, showBroker = false, actions, className }) {
  const prop = visit?.property || {};
  const cover = prop.images?.[0] || prop.video?.thumbnail || "";
  const startAt = visit?.schedule?.startAt;
  const preferred = visit?.preferredSlots || [];

  const scheduleLine = startAt
    ? formatVisitDate(startAt)
    : preferred[0]
      ? `Preferred: ${formatVisitDate(preferred[0], { withWeekday: false })}`
      : "Unscheduled";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-border p-3.5 transition-colors hover:bg-secondary/30 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <Link
        to={`/visits/${visit._id}`}
        className="flex min-w-0 flex-1 items-center gap-3.5"
      >
        <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
          {cover ? (
            <img src={cover} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <Building2 className="size-5 opacity-40" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-[15px] font-semibold text-foreground">
              {prop.title || "Property"}
            </p>
            <VisitStatusPill status={visit.visitStatus} />
          </div>

          <p className="truncate text-xs text-muted-foreground">
            {prop.location || "—"} · {formatPrice(prop.price ?? visit.price)}
          </p>

          <p className="truncate text-xs text-muted-foreground">
            {scheduleLine}
            {visit.buyer?.username ? ` · Buyer: ${visit.buyer.username}` : ""}
            {showBroker && visit.broker?.username
              ? ` · Broker: ${visit.broker.username}`
              : ""}
          </p>
        </div>
      </Link>

      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : (
        <Link
          to={`/visits/${visit._id}`}
          aria-label="Open visit"
          className="hidden shrink-0 text-muted-foreground sm:inline-flex"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
