import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Segmented control Tabs with animated active indicator.
 * Props: value, onValueChange, items: [{ value, label, count?, icon? }], className, fullWidth.
 */
export function Tabs({ value, onValueChange, items = [], className, fullWidth = false }) {
  const groupId = React.useId();

  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl border border-border/70 bg-muted/70 p-1 scrollbar-hide",
        fullWidth && "flex w-full",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.value === value;
        const Icon = item.icon;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onValueChange?.(item.value)}
            className={cn(
              "relative inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl px-3.5 text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              fullWidth && "flex-1",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active ? (
              <motion.span
                layoutId={`tab-pill-${groupId}`}
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
                className="absolute inset-0 rounded-xl bg-card shadow-soft ring-1 ring-border/60"
              />
            ) : null}
            <span className="relative z-10 inline-flex items-center gap-1.5">
              {Icon ? <Icon className="size-4" aria-hidden="true" /> : null}
              <span>{item.label}</span>
              {item.count !== undefined && item.count !== null ? (
                <span
                  className={cn(
                    "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.2 text-[11px] font-bold leading-4",
                    active
                      ? "bg-brand text-brand-foreground"
                      : "bg-foreground/10 text-muted-foreground",
                  )}
                >
                  {item.count}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
