import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "./button";

/* -------------------------------------------------------------------------- */
/*  Overlay stack — lets an app close the top-most dialog/sheet from a         */
/*  hardware back button (Capacitor) before navigating back.                   */
/* -------------------------------------------------------------------------- */
const overlayStack = [];

/** Closes the top-most open Dialog/Sheet. Returns `true` if one was closed. */
export function closeTopOverlay() {
  const top = overlayStack[overlayStack.length - 1];
  if (!top) return false;
  top.current?.();
  return true;
}

/** `true` while any Dialog/Sheet is open. */
export function hasOpenOverlay() {
  return overlayStack.length > 0;
}

/**
 * Low-level modal primitive built on the native `<dialog>` element (opened with
 * `showModal()`, so the page is inert, focus is contained and Esc/back gestures work).
 * Children are rendered inside `AnimatePresence`, so they can declare `exit` animations;
 * the dialog is closed/unmounted once those finish.
 *
 * Props: open, onOpenChange, dismissible (Esc / backdrop / back button), labelledBy,
 * describedBy, ariaLabel, backdropClassName, children.
 */
export function ModalRoot({
  open,
  onOpenChange,
  dismissible = true,
  labelledBy,
  describedBy,
  ariaLabel,
  backdropClassName,
  children,
}) {
  const ref = React.useRef(null);
  const [mounted, setMounted] = React.useState(open);
  if (open && !mounted) setMounted(true);

  const requestClose = React.useRef(null);
  requestClose.current = () => {
    if (dismissible) onOpenChange?.(false);
  };

  // Register in the overlay stack while open.
  React.useEffect(() => {
    if (!open) return undefined;
    const entry = requestClose;
    overlayStack.push(entry);
    return () => {
      const i = overlayStack.lastIndexOf(entry);
      if (i >= 0) overlayStack.splice(i, 1);
    };
  }, [open]);

  React.useLayoutEffect(() => {
    const d = ref.current;
    if (!mounted || !d || d.open) return;
    try {
      d.showModal();
    } catch {
      d.setAttribute("open", "");
    }
    const auto = d.querySelector("[data-autofocus]");
    if (auto) auto.focus({ preventScroll: true });
  }, [mounted]);

  const finish = React.useCallback(() => {
    const d = ref.current;
    if (d?.open) d.close();
    setMounted(false);
  }, []);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <dialog
      ref={ref}
      className="ui-modal"
      data-ptr-ignore=""
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-label={ariaLabel}
      onCancel={(e) => {
        // Esc / back gesture: animate out instead of closing instantly.
        e.preventDefault();
        requestClose.current?.();
      }}
      onClose={() => {
        // Closed by the browser anyway (e.g. repeated Esc) — sync state.
        if (open) onOpenChange?.(false);
        setMounted(false);
      }}
    >
      <AnimatePresence onExitComplete={finish}>
        {open ? (
          <motion.div
            key="ui-modal-layer"
            className="absolute inset-0"
            initial={{ opacity: 1 }}
            exit={{ opacity: 1, transition: { duration: 0.22 } }}
          >
            <motion.div
              aria-hidden
              className={cn(
                "absolute inset-0 bg-black/45 backdrop-blur-[3px]",
                backdropClassName,
              )}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => requestClose.current?.()}
            />
            {children}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </dialog>,
    document.body,
  );
}

/* -------------------------------------------------------------------------- */
/*  Dialog                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Centered modal dialog.
 * Props: open, onOpenChange, title, description, children, footer, className,
 * dismissible (default true), hideClose.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  dismissible = true,
  hideClose = false,
}) {
  const id = React.useId();
  const titleId = title ? `${id}-title` : undefined;
  const descId = description ? `${id}-desc` : undefined;

  return (
    <ModalRoot
      open={open}
      onOpenChange={onOpenChange}
      dismissible={dismissible}
      labelledBy={titleId}
      describedBy={descId}
      ariaLabel={title ? undefined : "Dialog"}
    >
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
        <motion.div
          className={cn(
            "pointer-events-auto relative flex max-h-full w-full max-w-md flex-col overflow-hidden rounded-3xl border border-border/60 bg-popover text-popover-foreground shadow-float",
            className,
          )}
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
        >
          {(title || description) && (
            <div className="px-6 pt-6 pr-14">
              {title ? (
                <h2 id={titleId} className="text-lg font-semibold tracking-tight">
                  {title}
                </h2>
              ) : null}
              {description ? (
                <p id={descId} className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              ) : null}
            </div>
          )}
          {!hideClose && dismissible ? (
            <button
              type="button"
              onClick={() => onOpenChange?.(false)}
              className="absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          ) : null}
          {children ? (
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
              {children}
            </div>
          ) : (
            <div className="h-4" />
          )}
          {footer ? (
            <div className="flex flex-col-reverse gap-2 border-t border-border/60 px-6 py-4 sm:flex-row sm:justify-end">
              {footer}
            </div>
          ) : null}
        </motion.div>
      </div>
    </ModalRoot>
  );
}

/**
 * Confirmation dialog. `onConfirm` may return a promise: the button shows a spinner
 * while it runs and the dialog closes when it resolves (stays open if it throws).
 * Props: open, onOpenChange, title, description, confirmLabel, cancelLabel,
 * destructive, onConfirm, loading, closeOnConfirm (default true), children.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title = "Are you sure?",
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  loading = false,
  closeOnConfirm = true,
  confirmDisabled = false,
  children,
}) {
  const [pending, setPending] = React.useState(false);
  const busy = loading || pending;

  const handleConfirm = async () => {
    if (busy) return;
    try {
      setPending(true);
      await onConfirm?.();
      if (closeOnConfirm) onOpenChange?.(false);
    } catch {
      /* caller surfaces the error; keep the dialog open */
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!busy) onOpenChange?.(v);
      }}
      title={title}
      description={description}
      dismissible={!busy}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange?.(false)} disabled={busy} data-autofocus="">
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            onClick={handleConfirm}
            loading={busy}
            disabled={confirmDisabled}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Dialog>
  );
}
