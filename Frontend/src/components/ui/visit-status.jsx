import * as React from "react";
import { Check, XCircle, Ban, AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "./badge";
import { VISIT_STATUS_META } from "@/lib/visit";

const COMPACT_STEPS = [
  { key: "requested", label: "Requested" },
  { key: "owner_approved", label: "Approved" },
  { key: "claimed", label: "Broker" },
  { key: "scheduled", label: "Scheduled" },
];

const TERMINAL_ICONS = {
  rejected: XCircle,
  cancelled: Ban,
  no_show: AlertTriangle,
};

export function VisitStatusPill({ status, className }) {
  const meta = VISIT_STATUS_META[status] || {
    shortLabel: status || "Pending",
    variant: "secondary",
  };
  return (
    <Badge variant={meta.variant} className={cn("gap-1.5", className)}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      <span>{meta.shortLabel || meta.label}</span>
    </Badge>
  );
}

/**
 * Minimal horizontal 4-dot progress bar (zero paragraphs, zero boxy clutter).
 */
export function VisitStepper({ visit, className }) {
  const status = visit?.visitStatus || "requested";
  const meta = VISIT_STATUS_META[status] || VISIT_STATUS_META.requested;
  const isTerminal = Boolean(meta.terminal);

  if (isTerminal) {
    const Icon = TERMINAL_ICONS[status] || Ban;
    return (
      <div
        className={cn(
          "flex items-center gap-2.5 rounded-xl border border-border/80 bg-secondary/40 px-3.5 py-2.5 text-sm",
          className,
        )}
      >
        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="font-semibold text-foreground">{meta.shortLabel}</span>
        {visit?.cancelledBy ? (
          <span className="text-muted-foreground">by {visit.cancelledBy}</span>
        ) : null}
      </div>
    );
  }

  const order = ["requested", "owner_approved", "claimed", "scheduled", "completed"];
  const currentIdx = order.indexOf(status);

  return (
    <div className={cn("py-2", className)}>
      <ol className="flex items-center justify-between">
        {COMPACT_STEPS.map((s, idx) => {
          const done = status === "completed" || idx < currentIdx;
          const active = status !== "completed" && idx === currentIdx;
          return (
            <React.Fragment key={s.key}>
              <li className="flex flex-col items-center gap-1.5">
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-[11px] font-bold transition-colors",
                    done || active
                      ? "bg-foreground text-background"
                      : "border border-border bg-background text-muted-foreground",
                    active && "ring-4 ring-foreground/10",
                  )}
                >
                  {done ? <Check className="size-3.5" aria-hidden="true" /> : idx + 1}
                </span>
                <span
                  className={cn(
                    "text-[11px] font-medium",
                    done || active ? "text-foreground font-semibold" : "text-muted-foreground",
                  )}
                >
                  {s.label}
                </span>
              </li>
              {idx < COMPACT_STEPS.length - 1 ? (
                <div
                  aria-hidden="true"
                  className={cn(
                    "mx-1 -mt-4 h-px flex-1",
                    idx < currentIdx || status === "completed"
                      ? "bg-foreground"
                      : "bg-border",
                  )}
                />
              ) : null}
            </React.Fragment>
          );
        })}
      </ol>
    </div>
  );
}
