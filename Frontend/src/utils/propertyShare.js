/**
 * Shareable links use HTTPS `/view/:id` so the same URL works in browsers and can be
 * verified for Android App Links (Digital Asset Links on your domain → opens the native app when installed).
 *
 * Set `VITE_PUBLIC_APP_ORIGIN` (e.g. https://propatyc.vercel.app). Capacitor’s WebView origin is often
 * https://localhost — that is never used for shares.
 */

/** Canonical site when env / window origin are unusable for sharing */
const SHARE_ORIGIN_FALLBACK = "https://propatyc.vercel.app";

function normalizeOrigin(origin) {
  if (typeof origin !== "string" || !origin.trim()) return "";
  return origin.trim().replace(/\/$/, "");
}

function isUnusableShareOrigin(origin) {
  if (!origin) return true;
  return (
    /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(origin) ||
    /^capacitor:\/\//i.test(origin) ||
    /^ionic:\/\//i.test(origin)
  );
}

export function getPublicAppOrigin() {
  const fromEnv = normalizeOrigin(import.meta.env.VITE_PUBLIC_APP_ORIGIN);
  if (fromEnv) return fromEnv;

  const win =
    typeof window !== "undefined"
      ? normalizeOrigin(window.location?.origin)
      : "";

  if (!isUnusableShareOrigin(win)) return win;

  return SHARE_ORIGIN_FALLBACK;
}

/**
 * Maps an opened HTTPS universal link to an in-app path if it matches `getPublicAppOrigin()`.
 */
export function universalLinkToAppPath(urlString) {
  try {
    const expected = getPublicAppOrigin();
    if (!expected || !urlString) return null;
    const u = new URL(urlString);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    const actual = normalizeOrigin(`${u.protocol}//${u.host}`);
    const exp = normalizeOrigin(expected);
    if (actual.toLowerCase() !== exp.toLowerCase()) return null;
    const path = `${u.pathname}${u.search}${u.hash}`;
    return path || "/";
  } catch {
    return null;
  }
}

/** Canonical universal link for this listing */
export function buildPropertyShareUrl(propertyId) {
  const base = getPublicAppOrigin();
  const id = encodeURIComponent(String(propertyId ?? ""));
  return `${base}/view/${id}`;
}

export function buildWhatsAppShareUrl(fullUrl, title) {
  const text = `${title ? `${title}\n\n` : ""}${fullUrl}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function buildTelegramShareUrl(fullUrl, title) {
  const q = new URLSearchParams();
  q.set("url", fullUrl);
  if (title) q.set("text", title);
  return `https://t.me/share/url?${q.toString()}`;
}

export async function copyTextToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

/** Safari / Chrome Android native share sheet (includes WhatsApp, Messages, …). */
export async function shareViaNavigatorShare({ title, text, url }) {
  if (typeof navigator === "undefined" || !navigator.share) return false;
  try {
    await navigator.share({
      title: title || "Propatyc",
      text: text || "",
      url,
    });
    return true;
  } catch (e) {
    if (e?.name === "AbortError") return true;
    return false;
  }
}
