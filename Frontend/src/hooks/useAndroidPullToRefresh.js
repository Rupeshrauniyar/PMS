import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

/** Distance finger must pull past before reload triggers */
const RELEASE_THRESHOLD_PX = 72;
/** Rubber-band scaling so pull feels controlled */
const RESISTANCE = 0.42;
const MAX_VISUAL_PULL_PX = 104;

function getScrollTop() {
  const el = document.scrollingElement || document.documentElement;
  return el.scrollTop || document.body.scrollTop || 0;
}

function shouldIgnoreTarget(target) {
  if (!(target instanceof Element)) return true;
  if (target.closest("[data-ptr-ignore]")) return true;
  if (target.closest(".swiper")) return true;
  return false;
}

/**
 * Native Android WebView: pull down from scroll-top → full page reload.
 * Disabled during keyboard / excluded zones (`data-ptr-ignore`, Swiper).
 */
export function useAndroidPullToRefresh() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") {
      return;
    }

    const indicator = document.createElement("div");
    indicator.className = "cap-ptr-indicator";
    indicator.setAttribute("aria-hidden", "true");
    indicator.innerHTML = '<div class="cap-ptr-spinner"></div>';
    document.body.appendChild(indicator);

    let startY = 0;
    let tracking = false;
    let maxDy = 0;

    const resetIndicator = () => {
      indicator.style.opacity = "0";
      indicator.style.transform = "translateX(-50%) translateY(-100%)";
      indicator.classList.remove("cap-ptr-armed");
    };

    const touchMoveOpts = { passive: false };

    const detachMoveListeners = () => {
      window.removeEventListener("touchmove", onTouchMove, touchMoveOpts);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      tracking = false;
    };

    const onTouchMove = (e) => {
      if (!tracking) return;
      if (document.body.classList.contains("keyboard-visible")) {
        detachMoveListeners();
        resetIndicator();
        return;
      }
      if (getScrollTop() > 2) {
        detachMoveListeners();
        resetIndicator();
        return;
      }

      const dy = e.touches[0].clientY - startY;
      if (dy <= 0) {
        resetIndicator();
        maxDy = 0;
        return;
      }

      maxDy = Math.max(maxDy, dy);
      const visual = Math.min(dy * RESISTANCE, MAX_VISUAL_PULL_PX);
      if (dy > 8) e.preventDefault();

      indicator.style.opacity = String(Math.min(dy / RELEASE_THRESHOLD_PX, 1));
      indicator.style.transform = `translateX(-50%) translateY(${visual}px)`;

      if (dy >= RELEASE_THRESHOLD_PX * 0.85)
        indicator.classList.add("cap-ptr-armed");
      else indicator.classList.remove("cap-ptr-armed");
    };

    const onTouchEnd = () => {
      detachMoveListeners();
      const reload =
        maxDy >= RELEASE_THRESHOLD_PX && getScrollTop() <= 2;
      resetIndicator();
      if (reload) window.location.reload();
      startY = 0;
      maxDy = 0;
    };

    const onTouchStart = (e) => {
      if (tracking) return;
      if (document.body.classList.contains("keyboard-visible")) return;
      if (getScrollTop() > 2) return;
      if (shouldIgnoreTarget(e.target)) return;

      startY = e.touches[0].clientY;
      maxDy = 0;
      tracking = true;

      window.addEventListener("touchmove", onTouchMove, touchMoveOpts);
      window.addEventListener("touchend", onTouchEnd);
      window.addEventListener("touchcancel", onTouchEnd);
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });

    return () => {
      detachMoveListeners();
      window.removeEventListener("touchstart", onTouchStart);
      indicator.remove();
    };
  }, []);
}
