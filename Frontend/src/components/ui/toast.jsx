import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

import { cn } from "@/lib/utils";

const ToastContext = React.createContext(null);

let idSeq = 1;

const ICONS = {
  default: Info,
  success: CheckCircle2,
  error: AlertCircle,
};

const STYLES = {
  default: "border-border/80 bg-popover/95 text-popover-foreground",
  success: "border-success/35 bg-popover/95 text-popover-foreground",
  error: "border-destructive/40 bg-popover/95 text-popover-foreground",
};

const ICON_COLORS = {
  default: "text-brand",
  success: "text-success",
  error: "text-destructive",
};

/**
 * Top-layer toast notifications using native Popover (`popover="manual"`) when supported,
 * with automatic fallback for older WebViews.
 */
export function ToastProvider({ children, withTabbar = true }) {
  const [toasts, setToasts] = React.useState([]);
  const regionRef = React.useRef(null);
  const [fallbackOpen, setFallbackOpen] = React.useState(false);

  const dismiss = React.useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback(
    (input) => {
      const opts = typeof input === "string" ? { title: input } : input || {};
      const id = `t-${idSeq++}`;
      const duration = opts.duration ?? 4000;
      const entry = {
        id,
        title: opts.title || "",
        description: opts.description || "",
        variant: opts.variant || "default",
      };
      setToasts((prev) => [...prev.slice(-3), entry]);
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss],
  );

  React.useLayoutEffect(() => {
    const el = regionRef.current;
    if (!el) return;
    const hasToasts = toasts.length > 0;
    const supportsPopover =
      typeof HTMLElement !== "undefined" &&
      Object.hasOwn(HTMLElement.prototype, "popover") &&
      typeof el.showPopover === "function";

    if (supportsPopover) {
      el.setAttribute("popover", "manual");
      try {
        if (hasToasts && !el.matches(":popover-open")) el.showPopover();
        else if (!hasToasts && el.matches(":popover-open")) el.hidePopover();
      } catch {
        setFallbackOpen(hasToasts);
      }
    } else {
      setFallbackOpen(hasToasts);
    }
  }, [toasts.length]);

  const ctx = React.useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {typeof document !== "undefined"
        ? createPortal(
            <section
              ref={regionRef}
              aria-label="Notifications"
              aria-live="polite"
              data-fallback-open={fallbackOpen ? "true" : undefined}
              className={cn("ui-toast-region flex flex-col gap-2", withTabbar && "with-tabbar")}
            >
              <AnimatePresence initial={false}>
                {toasts.map((t) => {
                  const Icon = ICONS[t.variant] || ICONS.default;
                  return (
                    <motion.div
                      key={t.id}
                      layout
                      role={t.variant === "error" ? "alert" : "status"}
                      initial={{ opacity: 0, y: 18, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.96 }}
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                      className={cn(
                        "pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-float backdrop-blur-xl",
                        STYLES[t.variant] || STYLES.default,
                      )}
                    >
                      <Icon
                        aria-hidden="true"
                        className={cn("mt-0.5 size-5 shrink-0", ICON_COLORS[t.variant] || ICON_COLORS.default)}
                      />
                      <div className="min-w-0 flex-1 text-sm">
                        {t.title ? <p className="font-semibold leading-snug">{t.title}</p> : null}
                        {t.description ? (
                          <p className={cn("text-muted-foreground leading-relaxed", t.title && "mt-0.5 text-[13px]")}>
                            {t.description}
                          </p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => dismiss(t.id)}
                        className="-mr-1 -mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
                        aria-label="Dismiss notification"
                      >
                        <X className="size-4" aria-hidden="true" />
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </section>,
            document.body,
          )
        : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    return {
      toast: () => {},
      dismiss: () => {},
    };
  }
  return ctx;
}
