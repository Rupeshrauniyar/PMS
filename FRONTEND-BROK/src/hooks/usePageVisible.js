import { useEffect, useRef, useSyncExternalStore } from "react";

const subscribe = (cb) => {
  document.addEventListener("visibilitychange", cb);
  return () => document.removeEventListener("visibilitychange", cb);
};
const getSnapshot = () => document.visibilityState === "visible";

/** `true` while the document/tab is visible (Page Visibility API). */
export function usePageVisible() {
  return useSyncExternalStore(subscribe, getSnapshot, () => true);
}

/**
 * Calls `callback` every `ms` while the page is visible, and once right
 * away when the page becomes visible again after being hidden.
 */
export function useVisiblePolling(callback, ms, { enabled = true } = {}) {
  const visible = usePageVisible();
  const cbRef = useRef(callback);
  cbRef.current = callback;
  const wasHidden = useRef(false);

  useEffect(() => {
    if (!enabled) return undefined;
    if (!visible) {
      wasHidden.current = true;
      return undefined;
    }
    if (wasHidden.current) {
      wasHidden.current = false;
      cbRef.current();
    }
    const id = window.setInterval(() => cbRef.current(), ms);
    return () => window.clearInterval(id);
  }, [visible, ms, enabled]);
}
