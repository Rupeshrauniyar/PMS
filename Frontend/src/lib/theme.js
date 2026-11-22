import { useEffect, useState, useCallback } from "react";

const THEME_EVENT = "propatyc-theme-change";

export function getResolvedTheme() {
  if (typeof window === "undefined") return "light";
  try {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") return saved;
  } catch {
    /* storage unavailable */
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches
    ? "dark"
    : "light";
}

export function applyThemePreference(nextTheme) {
  if (typeof document === "undefined") return "light";
  const resolved =
    nextTheme === "system"
      ? window.matchMedia?.("(prefers-color-scheme: dark)")?.matches
        ? "dark"
        : "light"
      : nextTheme === "dark"
        ? "dark"
        : "light";

  try {
    if (nextTheme === "system") {
      localStorage.removeItem("theme");
    } else {
      localStorage.setItem("theme", resolved);
    }
  } catch {
    /* ignore */
  }

  document.documentElement.classList.toggle("dark", resolved === "dark");
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: resolved }));
  return resolved;
}

export function useTheme() {
  const [theme, setThemeState] = useState(() => getResolvedTheme());

  useEffect(() => {
    const sync = () => setThemeState(getResolvedTheme());
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onMqChange = () => {
      try {
        if (!localStorage.getItem("theme")) {
          const next = mq.matches ? "dark" : "light";
          document.documentElement.classList.toggle("dark", next === "dark");
          setThemeState(next);
        }
      } catch {
        /* ignore */
      }
    };

    window.addEventListener(THEME_EVENT, sync);
    window.addEventListener("storage", sync);
    mq?.addEventListener?.("change", onMqChange);
    return () => {
      window.removeEventListener(THEME_EVENT, sync);
      window.removeEventListener("storage", sync);
      mq?.removeEventListener?.("change", onMqChange);
    };
  }, []);

  const setTheme = useCallback((next) => {
    const resolved = applyThemePreference(next);
    setThemeState(resolved);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = getResolvedTheme() === "dark" ? "light" : "dark";
    const resolved = applyThemePreference(next);
    setThemeState(resolved);
  }, []);

  return { theme, setTheme, toggleTheme };
}
