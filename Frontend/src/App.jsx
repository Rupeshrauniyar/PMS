import React, { useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import Index from "./Index";
import { AppProvider } from "./contexts/AppContext";
import { useAndroidPullToRefresh } from "./hooks/useAndroidPullToRefresh";

function isTypingTarget(el) {
  if (!el || !(el instanceof Element)) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag !== "INPUT") return false;
  const type = (el.type || "text").toLowerCase();
  const skip = new Set([
    "checkbox",
    "radio",
    "button",
    "submit",
    "reset",
    "file",
    "hidden",
    "image",
  ]);
  return !skip.has(type);
}

// import { Analytics } from "@vercel/analytics/next";
const App = () => {
  useAndroidPullToRefresh();

  useEffect(() => {
    // Apply persisted theme ASAP
    const savedTheme = localStorage.getItem("theme");
    const theme = savedTheme === "dark" ? "dark" : "light";
    document.documentElement.classList.toggle("dark", theme === "dark");

    if (Capacitor.isNativePlatform()) {
      SplashScreen.hide();
    }
  }, []);

  /** Stable chrome while keyboard / visual viewport changes (web + Capacitor WebView). */
  useEffect(() => {
    const setKb = (on) => {
      document.body.classList.toggle("keyboard-visible", on);
    };

    const onFocusIn = (e) => {
      if (isTypingTarget(e.target)) setKb(true);
    };

    const onFocusOut = () => {
      requestAnimationFrame(() => {
        if (!isTypingTarget(document.activeElement)) setKb(false);
      });
    };

    const vv = window.visualViewport;
    const onVvResize = () => {
      if (!vv) return;
      const ratio = vv.height / (window.innerHeight || vv.height);
      if (ratio < 0.76) setKb(true);
      else if (!isTypingTarget(document.activeElement)) setKb(false);
    };

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    vv?.addEventListener("resize", onVvResize);

    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      vv?.removeEventListener("resize", onVvResize);
      document.body.classList.remove("keyboard-visible");
    };
  }, []);

  return (
    <div className="w-full min-h-svh overflow-x-hidden bg-background text-foreground">
      {/* FCM:{FCM} */}
      {/* <Analytics /> */}
      <AppProvider>
        <Router>
          <Index />
        </Router>
      </AppProvider>
    </div>
  );
};

export default App;
