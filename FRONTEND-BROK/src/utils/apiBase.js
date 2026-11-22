import { Capacitor } from "@capacitor/core";

const DEFAULT_PROD_API = "https://pms-if0e.onrender.com";

export function getApiBase() {
  const raw = import.meta.env.VITE_backendUrl;
  if (typeof raw === "string" && raw.trim()) return raw.trim().replace(/\/$/, "");
  if (Capacitor.isNativePlatform()) return DEFAULT_PROD_API;
  if (import.meta.env.DEV) return "";
  return DEFAULT_PROD_API;
}
