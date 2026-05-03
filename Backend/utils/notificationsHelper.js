const UserModel = require("../Models/UserModel");
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
});

function buildFcmDataPayload({ kind, propId }) {
  const out = { kind: kind ? String(kind) : "" };
  if (propId) out.propId = String(propId);
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

/**
 * Prepend notification + optional FCM to user.
 */
exports.pushUserNotification = async (
  userId,
  { title, body = "", kind, propId = null },
  fcmTokens = null,
) => {
  if (!userId) return;

  const doc = {
    title,
    body,
    kind,
    read: false,
  };
  if (propId) doc.propId = propId;

  await UserModel.updateOne(
    { _id: userId },
    {
      $push: {
        notifications: {
          $each: [doc],
          $position: 0,
          $slice: MAX_NOTIFICATIONS_PER_USER,
        },
      },
    },
  );

  if (fcmTokens?.length) {
    await sendFcmMulticast(
      fcmTokens,
      { title, body },
      buildFcmDataPayload({ kind, propId }),
    );
  }
};

exports.sendFcmMulticastOnly = async (tokens, notification, data) => {
  await sendFcmMulticast(tokens, notification, data ?? {});
};
