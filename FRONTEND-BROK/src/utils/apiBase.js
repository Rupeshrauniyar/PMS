/**
 * Base URL for direct links / fetch (not using axios instance).
 * In Vite dev, default is "" so requests go through the proxy to the API.
 */
export function getApiBase() {
  const raw = import.meta.env.VITE_backendUrl;
  if (typeof raw === "string" && raw.trim()) return raw.trim().replace(/\/$/, "");
  if (import.meta.env.DEV) return "";
  return "";
}
