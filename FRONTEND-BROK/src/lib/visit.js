/**
 * Shared visit status metadata, date formatting, Maps link & client-side .ics generator.
 * Used identically in both Frontend (user app) and FRONTEND-BROK (broker app).
 */

export const VISIT_HAPPY_STEPS = [
  "requested",
  "owner_approved",
  "claimed",
  "scheduled",
  "completed",
];

export const VISIT_STATUS_META = Object.freeze({
  requested: {
    label: "Waiting for owner",
    shortLabel: "Requested",
    variant: "warning",
    description: "Waiting for the property owner to approve your visit request.",
  },
  owner_approved: {
    label: "Finding a broker",
    shortLabel: "Owner approved",
    variant: "info",
    description: "Approved by the owner and open for a Propatyc broker to claim.",
  },
  claimed: {
    label: "Broker assigned",
    shortLabel: "Broker assigned",
    variant: "brand",
    description: "A broker has claimed this visit and is coordinating the schedule.",
  },
  scheduled: {
    label: "Scheduled",
    shortLabel: "Scheduled",
    variant: "success",
    description: "In-person site visit is confirmed. All 3 parties are notified.",
  },
  completed: {
    label: "Completed",
    shortLabel: "Completed",
    variant: "success",
    description: "This site visit has been completed.",
  },
  rejected: {
    label: "Declined",
    shortLabel: "Declined",
    variant: "destructive",
    description: "The property owner declined this visit request.",
    terminal: true,
  },
  cancelled: {
    label: "Cancelled",
    shortLabel: "Cancelled",
    variant: "muted",
    description: "This visit was cancelled.",
    terminal: true,
  },
  no_show: {
    label: "Missed",
    shortLabel: "Missed",
    variant: "destructive",
    description: "Marked as a no-show at the scheduled time.",
    terminal: true,
  },
});

export const OPEN_VISIT_STATUSES = new Set([
  "requested",
  "owner_approved",
  "claimed",
  "scheduled",
]);

export function isOpenVisitStatus(status) {
  return OPEN_VISIT_STATUSES.has(status);
}

export function formatVisitDate(iso, { withWeekday = true } = {}) {
  if (!iso) return "Not scheduled yet";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  try {
    return new Intl.DateTimeFormat("en-IN", {
      ...(withWeekday ? { weekday: "short" } : {}),
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

export function formatVisitTimeRange(startIso, durationMin = 30) {
  if (!startIso) return "";
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) return "";
  const end = new Date(start.getTime() + (Number(durationMin) || 30) * 60 * 1000);
  try {
    const tf = new Intl.DateTimeFormat("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    });
    return `${tf.format(start)} – ${tf.format(end)} (${durationMin || 30} min)`;
  } catch {
    return `${durationMin || 30} min`;
  }
}

export function buildMapsUrl(query) {
  if (!query) return "https://www.google.com/maps";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(String(query).trim())}`;
}

function toIcsUtc(date) {
  return new Date(date)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function escapeIcsText(str = "") {
  return String(str)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * Generate an RFC 5545 .ics calendar string for a scheduled visit.
 */
export function buildIcs(visit) {
  const startAt = visit?.schedule?.startAt || visit?.date;
  if (!startAt) return null;
  const start = new Date(startAt);
  if (Number.isNaN(start.getTime())) return null;
  const durationMin = Number(visit?.schedule?.durationMin) || 30;
  const end = new Date(start.getTime() + durationMin * 60 * 1000);

  const title = visit?.property?.title || "Property Visit";
  const location =
    visit?.schedule?.meetingPoint || visit?.property?.location || "";
  const brokerLine = visit?.broker?.username
    ? `Broker: ${visit.broker.username}${visit.broker.phone ? ` (${visit.broker.phone})` : ""}`
    : "";
  const notes = [
    `Site visit for "${title}" via Propatyc.`,
    brokerLine,
    visit?.schedule?.notes ? `Notes: ${visit.schedule.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Propatyc//Site Visit//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:propatyc-visit-${visit?._id || Date.now()}@propatyc.app`,
    `DTSTAMP:${toIcsUtc(new Date())}`,
    `DTSTART:${toIcsUtc(start)}`,
    `DTEND:${toIcsUtc(end)}`,
    `SUMMARY:${escapeIcsText(`Property Visit: ${title}`)}`,
    location ? `LOCATION:${escapeIcsText(location)}` : null,
    `DESCRIPTION:${escapeIcsText(notes)}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT60M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Property visit in 1 hour",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return lines.join("\r\n");
}

export function downloadIcs(visit) {
  const ics = buildIcs(visit);
  if (!ics || typeof document === "undefined") return false;
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const slug = String(visit?.property?.title || "property-visit")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  a.href = url;
  a.download = `${slug || "visit"}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
