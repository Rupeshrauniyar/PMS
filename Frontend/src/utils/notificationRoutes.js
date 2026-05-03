/** Mirror Backend/utils/notificationsHelper NOTIFICATION_KINDS */
export const NOTIFICATION_KINDS = Object.freeze({
  LISTING_LIVE: "listing_live",
  BOOKING_NEW: "booking_new",
  BOOKING_CONFIRMED: "booking_confirmed",
  BOOKING_REJECTED: "booking_rejected",
  BOOKING_CANCELLED: "booking_cancelled",
});

function normPropId(v) {
  if (v == null) return "";
  if (typeof v === "object" && v._id != null) return String(v._id);
  return String(v);
}

function userOwnsProperty(user, propIdStr) {
  if (!user?.myProperties?.length) return false;
  return user.myProperties.some(
    (p) => normPropId(p.propId) === propIdStr,
  );
}

function userHasBookingForProperty(user, propIdStr) {
  if (!user?.bookedProperties?.length) return false;
  return user.bookedProperties.some((b) => {
    const pid = b?.propId;
    return normPropId(pid) === propIdStr;
  });
}

/**
 * Where to send the user when opening a notification that references a property.
 * — Owner → `/my/:id`
 * — Buyer booking flow → `/booked/:id` when applicable
 * — Else → `/view/:id`
 */
export function resolveNotificationPath(propId, kind, user) {
  const id = normPropId(propId);
  if (!id || id === "undefined") return "/";

  const owns = userOwnsProperty(user, id);
  const booked = userHasBookingForProperty(user, id);

  if (owns) return `/my/${id}`;

  const buyerKinds = new Set([
    NOTIFICATION_KINDS.BOOKING_CONFIRMED,
    NOTIFICATION_KINDS.BOOKING_REJECTED,
  ]);

  if (booked) return `/booked/${id}`;
  if (buyerKinds.has(kind)) return `/booked/${id}`;

  return `/view/${id}`;
}
