import { useCallback, useEffect, useSyncExternalStore } from "react";

const STORAGE_KEY = "theme";
const listeners = new Set();

function notify() {
  for (const l of listeners) l();
}

export function getStoredTheme() {
  if (typeof window === "undefined") return "system";
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "light" || raw === "dark" || raw === "system") return raw;
  } catch {
    /* ignore storage errors */
  }
  return "system";
}

export function resolveEffectiveTheme(pref = getStoredTheme()) {
  if (pref === "dark") return "dark";
  if (pref === "light") return "light";
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
}

export function applyThemePreference(pref = getStoredTheme()) {
  if (typeof document === "undefined") return "light";
  const effective = resolveEffectiveTheme(pref);
  document.documentElement.classList.toggle("dark", effective === "dark");
  document.documentElement.style.colorScheme = effective;
  return effective;
}

export function setThemePreference(next) {
  const valid = next === "dark" || next === "light" ? next : "system";
  try {
    localStorage.setItem(STORAGE_KEY, valid);
  } catch {
    /* ignore */
  }
  applyThemePreference(valid);
  notify();
}

let mediaBound = false;
function ensureMediaListener() {
  if (mediaBound || typeof window === "undefined" || !window.matchMedia) return;
  mediaBound = true;
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => {
    if (getStoredTheme() === "system") {
      applyThemePreference("system");
    }
    notify();
  };
  mq.addEventListener?.("change", onChange);
}

function subscribe(cb) {
  ensureMediaListener();
  listeners.add(cb);
  const onStorage = (e) => {
    if (e.key === STORAGE_KEY) {
      applyThemePreference(getStoredTheme());
      cb();
    }
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(cb);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

export function useTheme() {
  const preference = useSyncExternalStore(subscribe, getStoredTheme, () => "system");
  const resolved = resolveEffectiveTheme(preference);

  useEffect(() => {
    applyThemePreference(preference);
  }, [preference]);

  const setTheme = useCallback((next) => {
    setThemePreference(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemePreference(resolved === "dark" ? "light" : "dark");
  }, [resolved]);

  return {
    theme: preference,
    resolvedTheme: resolved,
    isDark: resolved === "dark",
    setTheme,
    toggleTheme,
  };
}
