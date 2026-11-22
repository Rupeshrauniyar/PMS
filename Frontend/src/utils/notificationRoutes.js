/** Mirror Backend/utils/notificationsHelper NOTIFICATION_KINDS */
export const NOTIFICATION_KINDS = Object.freeze({
  LISTING_LIVE: "listing_live",
  BOOKING_NEW: "booking_new",
  BOOKING_CONFIRMED: "booking_confirmed",
  BOOKING_REJECTED: "booking_rejected",
  BOOKING_CANCELLED: "booking_cancelled",
  VISIT_REQUESTED: "visit_requested",
  VISIT_OWNER_APPROVED: "visit_owner_approved",
  VISIT_OWNER_REJECTED: "visit_owner_rejected",
  VISIT_POOL_NEW: "visit_pool_new",
  VISIT_CLAIMED: "visit_claimed",
  VISIT_RELEASED: "visit_released",
  VISIT_SCHEDULED: "visit_scheduled",
  VISIT_RESCHEDULED: "visit_rescheduled",
  VISIT_CANCELLED: "visit_cancelled",
  VISIT_COMPLETED: "visit_completed",
  VISIT_NO_SHOW: "visit_no_show",
  VISIT_REMINDER: "visit_reminder",
  VISIT_REASSIGNED: "visit_reassigned",
});

function normId(v) {
  if (v == null) return "";
  if (typeof v === "object" && v._id != null) return String(v._id);
  const s = String(v).trim();
  if (!s || s === "undefined" || s === "null") return "";
  return s;
}

function userOwnsProperty(user, propIdStr) {
  if (!user?.myProperties?.length) return false;
  return user.myProperties.some((p) => normId(p.propId) === propIdStr);
}

function userHasBookingForProperty(user, propIdStr) {
  if (!user?.bookedProperties?.length) return false;
  return user.bookedProperties.some((b) => normId(b?.propId) === propIdStr);
}

/**
 * Resolve target route for a notification object or push payload.
 * Deep link rule:
 * - If `bookingId` present:
 *   - For visit notifications (or default per contract): `/visits/:bookingId`
 * - Else if `propId` present:
 *   - Owner on `booking_new` → `/my/:propId`
 *   - Buyer on `booking_confirmed`/`booking_rejected` with active booking → `/booked/:propId`
 *   - Default → `/view/:propId`
 */
export function resolveNotificationTarget(notification, user) {
  if (!notification) return "/notifications";
  const bookingId = normId(notification.bookingId);
  const propId = normId(notification.propId);
  const kind = String(notification.kind || "");

  if (bookingId) {
    // Pay-booking notifications without visit_* kind that belong to an existing pay booking
    const isLegacyBookingKind =
      kind === NOTIFICATION_KINDS.BOOKING_CONFIRMED ||
      kind === NOTIFICATION_KINDS.BOOKING_REJECTED ||
      kind === NOTIFICATION_KINDS.BOOKING_NEW ||
      kind === NOTIFICATION_KINDS.BOOKING_CANCELLED;

    if (isLegacyBookingKind && propId) {
      if (userOwnsProperty(user, propId)) return `/my/${propId}`;
      const match = user?.bookedProperties?.find(
        (b) => normId(b?._id) === bookingId || normId(b?.propId) === propId,
      );
      if (match && match.bType === "pay") {
        return `/booked/${propId}`;
      }
    }
    return `/visits/${bookingId}`;
  }

  if (propId) {
    return resolveNotificationPath(propId, kind, user);
  }

  if (kind.startsWith("visit_")) return "/visits";
  return "/";
}

/**
 * Backwards-compatible helper when given (propId, kind, user, bookingId?).
 */
export function resolveNotificationPath(propId, kind, user, bookingId) {
  const bid = normId(bookingId);
  if (bid) return `/visits/${bid}`;

  const id = normId(propId);
  if (!id) return "/";

  if (kind === NOTIFICATION_KINDS.BOOKING_NEW && userOwnsProperty(user, id)) {
    return `/my/${id}`;
  }

  const buyerKinds = new Set([
    NOTIFICATION_KINDS.BOOKING_CONFIRMED,
    NOTIFICATION_KINDS.BOOKING_REJECTED,
  ]);

  if (buyerKinds.has(kind) && userHasBookingForProperty(user, id)) {
    return `/booked/${id}`;
  }

  return `/view/${id}`;
}
