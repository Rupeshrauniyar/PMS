import * as React from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { ModalRoot } from "./dialog";

/**
 * Responsive Sheet built on `ModalRoot` (native `<dialog>` + `showModal()`):
 * - Mobile (<640px): bottom sheet with grab handle & swipe-down-to-dismiss.
 * - Desktop (>=640px): centered sleek modal panel (or right drawer if `side="right"`).
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  dismissible = true,
  side = "bottom",
}) {
  const id = React.useId();
  const titleId = title ? `${id}-sheet-title` : undefined;
  const descId = description ? `${id}-sheet-desc` : undefined;

  return (
    <ModalRoot
      open={open}
      onOpenChange={onOpenChange}
      dismissible={dismissible}
      labelledBy={titleId}
      describedBy={descId}
      ariaLabel={title ? undefined : "Sheet"}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 flex",
          side === "right"
            ? "items-stretch justify-end sm:p-3"
            : "items-end justify-center sm:items-center sm:p-4",
        )}
      >
        <motion.div
          className={cn(
            "pointer-events-auto relative flex w-full flex-col overflow-hidden border border-border/60 bg-popover text-popover-foreground shadow-float",
            side === "right"
              ? "h-full max-w-lg sm:rounded-3xl"
              : "max-h-[90svh] rounded-t-3xl sm:max-h-[85svh] sm:max-w-lg sm:rounded-3xl",
            className,
          )}
          initial={side === "right" ? { x: "100%" } : { y: "100%", opacity: 0.9 }}
          animate={{ x: 0, y: 0, opacity: 1 }}
          exit={side === "right" ? { x: "100%" } : { y: "100%", opacity: 0.85 }}
          transition={{ type: "spring", stiffness: 380, damping: 34 }}
          drag={dismissible && side === "bottom" ? "y" : false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.35 }}
          onDragEnd={(_, info) => {
            if (!dismissible) return;
            if (info.offset.y > 110 || info.velocity.y > 550) {
              onOpenChange?.(false);
            }
          }}
        >
          {side === "bottom" ? (
            <div className="flex justify-center pt-3 pb-1 sm:hidden" aria-hidden="true">
              <div className="h-1.5 w-11 rounded-full bg-muted-foreground/25" />
            </div>
          ) : null}

          {(title || description || dismissible) && (
            <div className="flex items-start justify-between gap-3 border-b border-border/60 px-5 pt-3 pb-3.5 sm:px-6 sm:pt-5 sm:pb-4">
              <div className="min-w-0">
                {title ? (
                  <h2 id={titleId} className="text-lg font-semibold tracking-tight">
                    {title}
                  </h2>
                ) : null}
                {description ? (
                  <p id={descId} className="mt-1 text-sm text-muted-foreground">
                    {description}
                  </p>
                ) : null}
              </div>
              {dismissible ? (
                <button
                  type="button"
                  onClick={() => onOpenChange?.(false)}
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  aria-label="Close"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              ) : null}
            </div>
          )}

          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6"
            onPointerDownCapture={(e) => e.stopPropagation()}
          >
            {children}
          </div>

          {footer ? (
            <div className="flex flex-col-reverse gap-2 border-t border-border/60 bg-popover/95 px-5 pt-3.5 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-6 sm:pb-4">
              {footer}
            </div>
          ) : (
            <div className="h-[env(safe-area-inset-bottom,0px)] sm:hidden" />
          )}
        </motion.div>
      </div>
    </ModalRoot>
  );
}
