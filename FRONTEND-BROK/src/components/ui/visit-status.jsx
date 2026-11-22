import * as React from "react";
import {
  Check,
  Clock,
  UserCheck,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Ban,
  AlertTriangle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "./badge";
import { VISIT_HAPPY_STEPS, VISIT_STATUS_META } from "@/lib/visit";

const STEP_ICONS = {
  requested: Clock,
  owner_approved: Check,
  claimed: UserCheck,
  scheduled: CalendarCheck,
  completed: CheckCircle2,
};

const TERMINAL_ICONS = {
  rejected: XCircle,
  cancelled: Ban,
  no_show: AlertTriangle,
};

export function VisitStatusPill({ status, short = false, className }) {
  const meta = VISIT_STATUS_META[status] || {
    label: status || "Unknown",
    shortLabel: status || "Unknown",
    variant: "muted",
  };
  return (
    <Badge variant={meta.variant} className={cn("gap-1.5", className)}>
      <span
        aria-hidden="true"
        className="size-1.5 rounded-full bg-current opacity-85"
      />
      <span>{short ? meta.shortLabel : meta.label}</span>
    </Badge>
  );
}

const STEP_DESCRIPTIONS = {
  requested: "Buyer submitted preferred visit slots",
  owner_approved: "Owner approved — open in broker pool",
  claimed: "Broker claimed & coordinating meet",
  scheduled: "In-person site visit confirmed for all 3",
  completed: "Site visit completed",
};

/**
 * Visual status stepper for a visit (`requested -> owner_approved -> claimed -> scheduled -> completed`),
 * with distinct banners for terminal states (`rejected`, `cancelled`, `no_show`).
 */
export function VisitStepper({ visit, className }) {
  const status = visit?.visitStatus || "requested";
  const meta = VISIT_STATUS_META[status] || VISIT_STATUS_META.requested;
  const isTerminal = Boolean(meta.terminal);

  // Determine the furthest happy-path step reached from the timeline when terminal.
  const reachedSet = React.useMemo(() => {
    const actions = new Set((visit?.timeline || []).map((t) => t.action));
    actions.add("requested");
    if (actions.has("rescheduled")) actions.add("scheduled");
    return actions;
  }, [visit?.timeline]);

  const activeIdx = VISIT_HAPPY_STEPS.indexOf(status);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {isTerminal ? (
        <div
          className={cn(
            "flex items-start gap-3 rounded-2xl border p-4",
            status === "cancelled"
              ? "border-border bg-muted/60 text-foreground"
              : "border-destructive/30 bg-danger-soft text-destructive",
          )}
        >
          {React.createElement(TERMINAL_ICONS[status] || Ban, {
            className: "mt-0.5 size-5 shrink-0",
            "aria-hidden": "true",
          })}
          <div className="min-w-0 text-sm">
            <p className="font-semibold">{meta.label}</p>
            <p className="mt-0.5 text-muted-foreground">
              {meta.description}
              {visit?.cancelledBy ? ` (by ${visit.cancelledBy})` : ""}
            </p>
          </div>
        </div>
      ) : null}

      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-5 sm:gap-2">
        {VISIT_HAPPY_STEPS.map((step, idx) => {
          const stepMeta = VISIT_STATUS_META[step];
          const Icon = STEP_ICONS[step] || Clock;
          const done = isTerminal
            ? reachedSet.has(step)
            : idx < activeIdx || status === "completed";
          const current = !isTerminal && idx === activeIdx && status !== "completed";

          return (
            <li
              key={step}
              className={cn(
                "relative flex items-center gap-3 rounded-2xl border p-3 transition-colors sm:flex-col sm:items-start sm:gap-2",
                current
                  ? "border-brand/50 bg-brand-soft/60 text-foreground shadow-soft"
                  : done
                    ? "border-success/30 bg-success-soft/45 text-foreground"
                    : "border-border/60 bg-card/50 text-muted-foreground",
              )}
            >
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  current
                    ? "bg-brand text-brand-foreground ring-4 ring-brand/20"
                    : done
                      ? "bg-success text-white"
                      : "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold leading-snug text-foreground">
                  {stepMeta.shortLabel}
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground sm:line-clamp-2">
                  {STEP_DESCRIPTIONS[step]}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
