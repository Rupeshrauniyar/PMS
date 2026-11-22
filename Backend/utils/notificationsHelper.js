const UserModel = require("../Models/UserModel");
const BrokerModel = require("../Models/Broker/UserModel");
const { getMessaging } = require("../services/firebaseAdmin");

/** Max notifications kept per user (newest first). */
const MAX_NOTIFICATIONS_PER_USER = 120;

/** Notification kind enum (persisted). */
exports.NOTIFICATION_KINDS = Object.freeze({
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

function buildFcmDataPayload({ kind, propId, bookingId }) {
  const out = { kind: kind ? String(kind) : "" };
  if (propId) out.propId = String(propId);
  if (bookingId) out.bookingId = String(bookingId);
  return out;
}

/**
 * Send FCM to device tokens with optional string data payload.
 */
async function sendFcmMulticast(tokens, notification, data = {}) {
  if (!tokens?.length) return;
  let messaging;
  try {
    messaging = getMessaging();
  } catch (e) {
    console.warn("FCM unavailable:", e.message);
    return;
  }

  const dataStrings = {};
  for (const [k, v] of Object.entries(data)) {
    dataStrings[k] = v == null ? "" : String(v);
  }

  const FCM_CHUNK = 500;
  for (let i = 0; i < tokens.length; i += FCM_CHUNK) {
    const slice = tokens.slice(i, i + FCM_CHUNK);
    try {
      await messaging.sendEachForMulticast({
        tokens: slice,
        notification,
        data: dataStrings,
      });
    } catch (e) {
      console.error("FCM sendEachForMulticast:", e.message);
    }
  }
}

async function pushToModel(
  Model,
  id,
  { title, body = "", kind, propId = null, bookingId = null },
  fcmTokens,
) {
  if (!id) return;

  const doc = { title, body, kind, read: false };
  if (propId) doc.propId = propId;
  if (bookingId) doc.bookingId = bookingId;

  let tokens = fcmTokens;
  try {
    const updated = await Model.findOneAndUpdate(
      { _id: id },
      {
        $push: {
          notifications: {
            $each: [doc],
            $position: 0,
            $slice: MAX_NOTIFICATIONS_PER_USER,
          },
        },
      },
      { projection: { FCMtokens: 1 }, new: true },
    ).lean();
    if (tokens == null) tokens = updated?.FCMtokens ?? [];
  } catch (e) {
    console.error("pushNotification persist failed:", e.message);
  }

  if (tokens?.length) {
    await sendFcmMulticast(
      tokens,
      { title, body },
      buildFcmDataPayload({ kind, propId, bookingId }),
    );
  }
}

/**
 * Prepend notification + optional FCM to user.
 * If `fcmTokens` is null, the user's stored tokens are used.
 */
exports.pushUserNotification = async (userId, payload, fcmTokens = null) =>
  pushToModel(UserModel, userId, payload, fcmTokens);

/** Same as pushUserNotification, but for broker accounts. */
exports.pushBrokerNotification = async (brokerId, payload, fcmTokens = null) =>
  pushToModel(BrokerModel, brokerId, payload, fcmTokens);

/** Notify every active broker (e.g. a new visit landed in the pool). */
exports.broadcastToBrokers = async (payload, { excludeId = null } = {}) => {
  const query = { isActive: { $ne: false } };
  if (excludeId) query._id = { $ne: excludeId };
  const brokers = await BrokerModel.find(query).select("_id FCMtokens").lean();
  await Promise.all(
    brokers.map((b) => pushToModel(BrokerModel, b._id, payload, b.FCMtokens ?? [])),
  );
};

exports.sendFcmMulticastOnly = async (tokens, notification, data) => {
  await sendFcmMulticast(tokens, notification, data ?? {});
};
