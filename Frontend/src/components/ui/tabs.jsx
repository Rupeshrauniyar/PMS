import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * High-contrast monochrome segmented Tabs.
 */
export function Tabs({ value, onValueChange, items = [], className, fullWidth = false }) {
  const groupId = React.useId();

  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-border/80 bg-secondary/70 p-1 scrollbar-hide",
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
              "relative inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full px-4 text-[13px] font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
              fullWidth && "flex-1",
              active ? "text-background" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active ? (
              <motion.span
                layoutId={`tab-pill-${groupId}`}
                transition={{ type: "spring", stiffness: 460, damping: 36 }}
                className="absolute inset-0 rounded-full bg-foreground"
              />
            ) : null}
            <span className="relative z-10 inline-flex items-center gap-1.5">
              {Icon ? <Icon className="size-3.5" aria-hidden="true" /> : null}
              <span>{item.label}</span>
              {item.count !== undefined && item.count !== null ? (
                <span
                  className={cn(
                    "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-4 tabular-nums",
                    active
                      ? "bg-background/20 text-background"
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
