/**
 * Shared formatting helpers (app-agnostic; copied verbatim between Frontend & FRONTEND-BROK).
 */

const INR_FMT = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

/**
 * Format a numeric or string price as "Rs. 25,000".
 */
export function formatPrice(value, { prefix = "रू. ", fallback = "Price on request" } = {}) {
  if (value === undefined || value === null || value === "") return fallback;
  const num =
    typeof value === "number"
      ? value
      : Number(String(value).replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(num)) return String(value);
  return `${prefix}${INR_FMT.format(Math.round(num))}`;
}

/**
 * Compact price ("Rs. 25K", "Rs. 1.2Cr") for tight badges/chips.
 */
export function formatCompactPrice(value, prefix = "रू. ") {
  const num =
    typeof value === "number"
      ? value
      : Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(num)) return formatPrice(value, { prefix });
  if (num >= 1_00_00_000) {
    return `${prefix}${(num / 1_00_00_000).toFixed(num % 1_00_00_000 === 0 ? 0 : 1)}Cr`;
  }
  if (num >= 1_00_000) {
    return `${prefix}${(num / 1_00_000).toFixed(num % 1_00_000 === 0 ? 0 : 1)}L`;
  }
  if (num >= 1_000) {
    return `${prefix}${Math.round(num / 100) / 10}K`;
  }
  return `${prefix}${INR_FMT.format(num)}`;
}

/**
 * Friendly relative time ("just now", "12m ago", "3h ago", "2d ago", or short date).
 */
export function timeAgo(iso) {
  if (!iso) return "";
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return "";
  const diffSec = Math.round((Date.now() - ts) / 1000);
  if (diffSec < 45) return "just now";
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      ...(days > 330 ? { year: "numeric" } : {}),
    }).format(new Date(ts));
  } catch {
    return new Date(ts).toLocaleDateString();
  }
}

export function formatBytes(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return "0 B";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDuration(seconds) {
  const n = Math.round(Number(seconds));
  if (!Number.isFinite(n) || n <= 0) return "";
  const m = Math.floor(n / 60);
  const s = n % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
