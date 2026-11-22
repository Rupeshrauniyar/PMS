import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { PushNotifications } from "@capacitor/push-notifications";

import { authApi } from "@/api/broker";
import { closeTopOverlay } from "@/components/ui/dialog";
import { useApp } from "@/contexts/AppContext";
import { useLive } from "@/contexts/LiveContext";
import { useToast } from "@/components/ui/toast";

/**
 * Coordinates Capacitor hardware back button, FCM push notifications
 * (deep-linking `bookingId` -> `/visits/:bookingId`), and mobile keyboard
 * tab-bar tucking.
 */
export function useNativeBridge() {
  const { user } = useApp();
  const live = useLive();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const pathnameRef = useRef(location.pathname);
  pathnameRef.current = location.pathname;

  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  const liveRef = useRef(live);
  liveRef.current = live;

  const toastRef = useRef(toast);
  toastRef.current = toast;

  // 1. Hardware back button (native platforms only)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;
    let handle = null;
    let cancelled = false;

    (async () => {
      try {
        const sub = await CapacitorApp.addListener("backButton", () => {
          if (closeTopOverlay()) return;
          if (pathnameRef.current !== "/") {
            navigateRef.current(-1);
          } else {
            CapacitorApp.exitApp();
          }
        });
        if (cancelled) sub?.remove?.();
        else handle = sub;
      } catch {
        /* ignore listener errors */
      }
    })();

    return () => {
      cancelled = true;
      try {
        handle?.remove?.();
      } catch {
        /* ignore */
      }
    };
  }, []);

  // 2. Push notifications (native platforms + authenticated broker only)
  const userId = user?._id || null;
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !userId) return undefined;

    let cancelled = false;
    const handles = [];

    const setup = async () => {
      try {
        let perm = await PushNotifications.checkPermissions();
        if (perm.receive === "prompt") {
          perm = await PushNotifications.requestPermissions();
        }
        if (cancelled || perm.receive !== "granted") return;

        const regHandle = await PushNotifications.addListener("registration", async (tokenData) => {
          const token = tokenData?.value;
          if (!token || cancelled) return;
          try {
            localStorage.setItem("fcmToken", token);
            await authApi.updateFcmToken(token);
          } catch {
            /* best-effort registration sync */
          }
        });
        handles.push(regHandle);

        const errHandle = await PushNotifications.addListener("registrationError", () => {
          /* silent — never log tokens or credentials */
        });
        handles.push(errHandle);

        const recvHandle = await PushNotifications.addListener(
          "pushNotificationReceived",
          (notification) => {
            liveRef.current?.refreshAll?.();
            if (notification?.title) {
              toastRef.current?.({
                title: notification.title,
                description: notification.body || "",
              });
            }
          },
        );
        handles.push(recvHandle);

        const actionHandle = await PushNotifications.addListener(
          "pushNotificationActionPerformed",
          (event) => {
            liveRef.current?.refreshAll?.();
            const data = event?.notification?.data || {};
            if (data.bookingId) {
              navigateRef.current(`/visits/${data.bookingId}`);
            } else if (data.kind === "visit_pool_new") {
              navigateRef.current("/pool");
            } else {
              navigateRef.current("/notifications");
            }
          },
        );
        handles.push(actionHandle);

        if (cancelled) {
          for (const h of handles) h?.remove?.();
          return;
        }

        await PushNotifications.register();
      } catch {
        /* push unsupported or misconfigured on device */
      }
    };

    setup();

    return () => {
      cancelled = true;
      for (const h of handles) {
        try {
          h?.remove?.();
        } catch {
          /* ignore */
        }
      }
    };
  }, [userId]);

  // 3. Tuck bottom tabbar on mobile when typing inside form controls
  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const isTextInput = (el) => {
      if (!el || !el.tagName) return false;
      const tag = el.tagName.toUpperCase();
      if (tag === "TEXTAREA") return true;
      if (tag === "INPUT") {
        const t = (el.getAttribute("type") || "text").toLowerCase();
        return !["checkbox", "radio", "button", "submit", "reset", "file", "range"].includes(t);
      }
      return Boolean(el.isContentEditable);
    };

    const onFocusIn = (e) => {
      if (window.innerWidth < 1024 && isTextInput(e.target)) {
        document.body.classList.add("keyboard-visible");
      }
    };
    const onFocusOut = () => {
      window.setTimeout(() => {
        if (!isTextInput(document.activeElement)) {
          document.body.classList.remove("keyboard-visible");
        }
      }, 80);
    };

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      document.body.classList.remove("keyboard-visible");
    };
  }, []);
}
