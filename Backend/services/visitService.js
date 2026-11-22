/**
 * Visit workflow service.
 *
 * Lifecycle (BookingModel with bType === "visit"):
 *   requested --owner approves--> owner_approved --broker claims--> claimed
 *   claimed --broker schedules--> scheduled --broker--> completed | no_show
 *   requested --owner rejects--> rejected
 *   any open state --buyer/owner/broker cancels--> cancelled
 *   claimed --broker releases--> owner_approved (back in the pool)
 *
 * All state transitions use conditional atomic updates so concurrent requests
 * (e.g. two brokers claiming the same visit) can never both succeed.
 */
const BookingModel = require("../Models/BookingModel");
const { OPEN_VISIT_STATUSES } = require("../Models/BookingModel");
const PropertyModel = require("../Models/PropertyModel");
const UserModel = require("../Models/UserModel");
const BrokerModel = require("../Models/Broker/UserModel");
const {
  pushUserNotification,
  pushBrokerNotification,
  broadcastToBrokers,
  NOTIFICATION_KINDS: K,
} = require("../utils/notificationsHelper");

const APP_TIMEZONE = process.env.APP_TIMEZONE || "Asia/Kathmandu";
const MAX_PREFERRED_SLOTS = 3;
const MIN_LEAD_MS = 5 * 60 * 1000; // schedule at least 5 minutes ahead
const MAX_AHEAD_MS = 120 * 24 * 60 * 60 * 1000; // ...and at most ~4 months ahead
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

class VisitError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function formatWhen(date) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      timeZone: APP_TIMEZONE,
    }).format(new Date(date));
  } catch {
    return new Date(date).toISOString();
  }
}

function timelineEntry(action, by, actorId, note = "") {
  return { action, by, actorId: actorId || null, note: String(note || "").slice(0, 500), at: new Date() };
}

/** Parse + validate an ISO date string; returns Date or throws. */
function parseFutureDate(value, label = "date") {
  const d = new Date(value);
  if (!value || Number.isNaN(d.getTime())) {
    throw new VisitError(400, `Invalid ${label}.`);
  }
  const now = Date.now();
  if (d.getTime() < now + MIN_LEAD_MS) {
    throw new VisitError(400, `The ${label} must be in the future.`);
  }
  if (d.getTime() > now + MAX_AHEAD_MS) {
    throw new VisitError(400, `The ${label} is too far in the future.`);
  }
  return d;
}

// ---------------------------------------------------------------------------
// Loading & serialization
// ---------------------------------------------------------------------------

const PROPERTY_FIELDS =
  "_id title location images video price sellingType propertyType rooms washrooms area owner";

async function loadVisit(id) {
  const visit = await BookingModel.findOne({ _id: id, bType: "visit" })
    .populate({ path: "propId", select: PROPERTY_FIELDS })
    .populate({ path: "userId", select: "_id username pp phone email" })
    .populate({ path: "broker", select: "_id username pp phone email role" })
    .lean();
  if (!visit) throw new VisitError(404, "Visit not found.");
  return visit;
}

async function loadOwner(property) {
  if (!property?.owner) return null;
  return UserModel.findById(property.owner)
    .select("_id username pp phone email FCMtokens")
    .lean();
}

function pickPerson(p, { withContact }) {
  if (!p) return null;
  const out = { _id: p._id, username: p.username, pp: p.pp || null };
  if (withContact) {
    out.phone = p.phone || null;
    out.email = p.email || null;
  }
  return out;
}

/**
 * Role-aware view of a visit.
 * - Buyer & owner see each other's name only; they see the broker's contact once assigned.
 * - Broker sees buyer & owner contact only after claiming (or as superbroker).
 */
function serializeVisit(visit, owner, viewerRole, { brokerCanSeeContact = false } = {}) {
  const prop = visit.propId || null;
  const isBroker = viewerRole === "broker";
  const brokerContact = isBroker ? brokerCanSeeContact : !!visit.broker;

  return {
    _id: visit._id,
    visitStatus: visit.visitStatus,
    active: visit.active,
    price: visit.price,
    note: visit.note || "",
    preferredSlots: visit.preferredSlots || [],
    schedule: visit.schedule || null,
    claimedAt: visit.claimedAt || null,
    cancelledBy: visit.cancelledBy || null,
    outcome: visit.outcome || "",
    timeline: visit.timeline || [],
    createdAt: visit.createdAt,
    updatedAt: visit.updatedAt,
    viewerRole,
    property: prop
      ? {
          _id: prop._id,
          title: prop.title,
          location: prop.location,
          images: prop.images || [],
          video: prop.video || null,
          price: prop.price,
          sellingType: prop.sellingType,
          propertyType: prop.propertyType,
          rooms: prop.rooms,
          washrooms: prop.washrooms,
          area: prop.area,
        }
      : null,
    buyer: pickPerson(visit.userId, { withContact: isBroker && brokerCanSeeContact }),
    owner: pickPerson(owner, { withContact: isBroker && brokerCanSeeContact }),
    broker: pickPerson(visit.broker, { withContact: brokerContact }),
  };
}

/** Determine whether a *user* (not broker) is the buyer or owner of a visit. */
function userRoleFor(visit, userId) {
  const uid = String(userId);
  if (visit.userId && String(visit.userId._id || visit.userId) === uid) return "buyer";
  if (visit.propId?.owner && String(visit.propId.owner) === uid) return "owner";
  return null;
}

// ---------------------------------------------------------------------------
// Notification fan-out
// ---------------------------------------------------------------------------

async function notifyParties(visit, owner, payload, { buyer = true, ownerToo = true, broker = true } = {}) {
  const base = {
    kind: payload.kind,
    propId: visit.propId?._id || visit.propId,
    bookingId: visit._id,
  };
  const jobs = [];
  if (buyer && visit.userId) {
    const b = payload.buyer || payload.all;
    if (b) jobs.push(pushUserNotification(visit.userId._id || visit.userId, { ...base, ...b }));
  }
  if (ownerToo && owner) {
    const o = payload.owner || payload.all;
    if (o) jobs.push(pushUserNotification(owner._id, { ...base, ...o }, owner.FCMtokens ?? null));
  }
  if (broker && visit.broker) {
    const br = payload.broker || payload.all;
    if (br) jobs.push(pushBrokerNotification(visit.broker._id || visit.broker, { ...base, ...br }));
  }
  const results = await Promise.allSettled(jobs);
  results
    .filter((r) => r.status === "rejected")
    .forEach((r) => console.error("visit notification failed:", r.reason?.message || r.reason));
}

/** Atomic conditional transition. Returns the fresh, populated visit or throws 409. */
async function transition(id, condition, update, conflictMessage) {
  const updated = await BookingModel.findOneAndUpdate(
    { _id: id, bType: "visit", ...condition },
    { ...update, $set: { ...(update.$set || {}), updatedAt: new Date() } },
    { new: true },
  ).select("_id");
  if (!updated) {
    // Distinguish "doesn't exist" from "wrong state".
    const exists = await BookingModel.exists({ _id: id, bType: "visit" });
    if (!exists) throw new VisitError(404, "Visit not found.");
    throw new VisitError(409, conflictMessage || "This visit was updated by someone else. Refresh and try again.", "CONFLICT");
  }
  return loadVisit(id);
}

async function detachBooking(visit) {
  const propId = visit.propId?._id || visit.propId;
  const userId = visit.userId?._id || visit.userId;
  await Promise.all([
    UserModel.updateOne({ _id: userId }, { $pull: { bookedProperties: visit._id } }),
    PropertyModel.updateOne({ _id: propId }, { $pull: { bookers: visit._id } }),
  ]);
}

// ---------------------------------------------------------------------------
// Buyer / owner actions
// ---------------------------------------------------------------------------

async function createVisit({ userId, propId, preferredSlots = [], note = "", price }) {
  const prop = await PropertyModel.findById(propId).select("_id title price owner status").lean();
  if (!prop) throw new VisitError(404, "Property not found.");
  if (String(prop.owner) === String(userId)) {
    throw new VisitError(400, "You can't request a visit to your own property.");
  }
  if (prop.status) throw new VisitError(400, "This property is no longer available.");

  const existing = await BookingModel.findOne({
    userId,
    propId,
    active: true,
  })
    .select("_id bType")
    .lean();
  if (existing) {
    throw new VisitError(409, "You already have an active request for this property.", "DUPLICATE");
  }

  const slots = (Array.isArray(preferredSlots) ? preferredSlots : [preferredSlots])
    .filter(Boolean)
    .slice(0, MAX_PREFERRED_SLOTS)
    .map((s) => parseFutureDate(s, "preferred time"))
    .sort((a, b) => a - b);

  const visit = await BookingModel.create({
    userId,
    propId,
    price: String(price ?? prop.price ?? "0"),
    date: slots[0] ? slots[0].toISOString() : undefined,
    note: String(note || "").slice(0, 1000),
    bType: "visit",
    visitStatus: "requested",
    preferredSlots: slots,
    timeline: [timelineEntry("requested", "buyer", userId, note)],
  });

  await Promise.all([
    PropertyModel.updateOne({ _id: propId }, { $push: { bookers: visit._id } }),
    UserModel.updateOne({ _id: userId }, { $push: { bookedProperties: visit._id } }),
  ]);

  const full = await loadVisit(visit._id);
  const owner = await loadOwner(full.propId);
  await notifyParties(
    full,
    owner,
    {
      kind: K.VISIT_REQUESTED,
      owner: {
        title: "New visit request",
        body: `${full.userId?.username || "Someone"} wants to visit "${prop.title}". Review and approve it.`,
      },
    },
    { buyer: false, broker: false },
  );
  return serializeVisit(full, owner, "buyer");
}

async function getVisitForUser(id, userId) {
  const visit = await loadVisit(id);
  const role = userRoleFor(visit, userId);
  if (!role) throw new VisitError(403, "You don't have access to this visit.");
  const owner = await loadOwner(visit.propId);
  return serializeVisit(visit, owner, role);
}

async function listVisitsForUser(userId, { role = "buyer", status } = {}) {
  let query;
  if (role === "owner") {
    const props = await PropertyModel.find({ owner: userId }).select("_id").lean();
    query = { bType: "visit", propId: { $in: props.map((p) => p._id) } };
  } else {
    query = { bType: "visit", userId };
  }
  if (status === "open") query.visitStatus = { $in: OPEN_VISIT_STATUSES };
  else if (status === "closed") query.visitStatus = { $nin: OPEN_VISIT_STATUSES };
  else if (status && status !== "all") query.visitStatus = status;

  const visits = await BookingModel.find(query)
    .populate({ path: "propId", select: PROPERTY_FIELDS })
    .populate({ path: "userId", select: "_id username pp phone email" })
    .populate({ path: "broker", select: "_id username pp phone email role" })
    .sort({ updatedAt: -1, createdAt: -1 })
    .limit(200)
    .lean();

  const ownerIds = [...new Set(visits.map((v) => String(v.propId?.owner || "")).filter(Boolean))];
  const owners = await UserModel.find({ _id: { $in: ownerIds } }).select("_id username pp").lean();
  const ownerMap = new Map(owners.map((o) => [String(o._id), o]));

  return visits.map((v) => serializeVisit(v, ownerMap.get(String(v.propId?.owner)) || null, role));
}

async function ownerDecision(id, userId, approve, note = "") {
  const visit = await loadVisit(id);
  if (userRoleFor(visit, userId) !== "owner") {
    throw new VisitError(403, "Only the property owner can approve or reject this visit.");
  }

  let updated;
  if (approve) {
    updated = await transition(
      id,
      { visitStatus: "requested" },
      {
        $set: { visitStatus: "owner_approved" },
        $push: { timeline: timelineEntry("owner_approved", "owner", userId, note) },
      },
      "This request is no longer waiting for approval.",
    );
  } else {
    updated = await transition(
      id,
      { visitStatus: "requested" },
      {
        $set: { visitStatus: "rejected", active: false, status: false },
        $push: { timeline: timelineEntry("rejected", "owner", userId, note) },
      },
      "This request is no longer waiting for approval.",
    );
    await detachBooking(updated);
  }

  const owner = await loadOwner(updated.propId);
  const title = updated.propId?.title || "the property";
  if (approve) {
    await notifyParties(
      updated,
      owner,
      {
        kind: K.VISIT_OWNER_APPROVED,
        buyer: {
          title: "Visit approved by owner",
          body: `The owner approved your visit to "${title}". A broker will schedule it shortly.`,
        },
      },
      { ownerToo: false, broker: false },
    );
    await broadcastToBrokers({
      kind: K.VISIT_POOL_NEW,
      title: "New visit request",
      body: `"${title}" in ${updated.propId?.location || "your area"} needs a broker.`,
      propId: updated.propId?._id,
      bookingId: updated._id,
    }).catch((e) => console.error("broadcastToBrokers:", e.message));
  } else {
    await notifyParties(
      updated,
      owner,
      {
        kind: K.VISIT_OWNER_REJECTED,
        buyer: {
          title: "Visit request declined",
          body: `The owner declined your visit request for "${title}".`,
        },
      },
      { ownerToo: false, broker: false },
    );
  }
  return serializeVisit(updated, owner, "owner");
}

async function cancelVisit(id, { actor, actorId, reason = "" }) {
  const visit = await loadVisit(id);

  if (actor === "user" || actor === "buyer" || actor === "owner") {
    const role = userRoleFor(visit, actorId);
    if (!role) throw new VisitError(403, "You don't have access to this visit.");
    actor = role;
  } else if (actor === "broker") {
    if (!visit.broker || String(visit.broker._id) !== String(actorId)) {
      throw new VisitError(403, "Only the assigned broker can cancel this visit.");
    }
  }

  const updated = await transition(
    id,
    { visitStatus: { $in: OPEN_VISIT_STATUSES } },
    {
      $set: { visitStatus: "cancelled", active: false, cancelledBy: actor },
      $push: { timeline: timelineEntry("cancelled", actor, actorId, reason) },
    },
    "This visit can no longer be cancelled.",
  );
  await detachBooking(updated);

  const owner = await loadOwner(updated.propId);
  const title = updated.propId?.title || "the property";
  const who = { buyer: "The buyer", owner: "The owner", broker: "The broker", system: "Propatyc" }[actor];
  const msg = {
    title: "Visit cancelled",
    body: `${who} cancelled the visit to "${title}".${reason ? ` Reason: ${String(reason).slice(0, 120)}` : ""}`,
  };
  await notifyParties(
    updated,
    owner,
    { kind: K.VISIT_CANCELLED, all: msg },
    { buyer: actor !== "buyer", ownerToo: actor !== "owner", broker: actor !== "broker" },
  );
  return serializeVisit(updated, owner, actor === "broker" ? "broker" : actor, {
    brokerCanSeeContact: actor === "broker",
  });
}

// ---------------------------------------------------------------------------
// Broker actions
// ---------------------------------------------------------------------------

async function loadBroker(brokerId) {
  const broker = await BrokerModel.findById(brokerId).select("_id username role isActive").lean();
  if (!broker) throw new VisitError(403, "Broker account not found.");
  if (broker.isActive === false) throw new VisitError(403, "Your broker account is inactive.");
  return broker;
}

function assertAssigned(visit, broker) {
  if (!visit.broker || String(visit.broker._id) !== String(broker._id)) {
    throw new VisitError(403, "This visit is assigned to another broker.");
  }
}

async function getVisitForBroker(id, brokerId) {
  const broker = await loadBroker(brokerId);
  const visit = await loadVisit(id);
  const mine = visit.broker && String(visit.broker._id) === String(broker._id);
  const inPool = visit.visitStatus === "owner_approved" && !visit.broker;
  const isSuper = broker.role === "superbroker";
  if (!mine && !inPool && !isSuper) {
    throw new VisitError(403, "This visit is assigned to another broker.");
  }
  const owner = await loadOwner(visit.propId);
  return serializeVisit(visit, owner, "broker", { brokerCanSeeContact: mine || isSuper });
}

async function listPool({ page = 1, limit = 20 } = {}) {
  const query = { bType: "visit", visitStatus: "owner_approved", broker: null, active: true };
  const [visits, total] = await Promise.all([
    BookingModel.find(query)
      .populate({ path: "propId", select: PROPERTY_FIELDS })
      .populate({ path: "userId", select: "_id username pp" })
      .sort({ updatedAt: 1 }) // oldest first: fair queue
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    BookingModel.countDocuments(query),
  ]);
  const ownerIds = [...new Set(visits.map((v) => String(v.propId?.owner || "")).filter(Boolean))];
  const owners = await UserModel.find({ _id: { $in: ownerIds } }).select("_id username pp").lean();
  const ownerMap = new Map(owners.map((o) => [String(o._id), o]));
  return {
    visits: visits.map((v) => serializeVisit(v, ownerMap.get(String(v.propId?.owner)) || null, "broker")),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

async function listBrokerVisits(brokerId, { status, from, to, all = false } = {}) {
  const query = { bType: "visit" };
  if (!all) query.broker = brokerId;
  else query.broker = { $ne: null };

  if (status === "open" || !status) query.visitStatus = { $in: ["claimed", "scheduled"] };
  else if (status === "closed") query.visitStatus = { $in: ["completed", "no_show", "cancelled"] };
  else if (status !== "all") query.visitStatus = status;

  if (from || to) {
    query["schedule.startAt"] = {};
    if (from) query["schedule.startAt"].$gte = new Date(from);
    if (to) query["schedule.startAt"].$lte = new Date(to);
  }

  const visits = await BookingModel.find(query)
    .populate({ path: "propId", select: PROPERTY_FIELDS })
    .populate({ path: "userId", select: "_id username pp phone email" })
    .populate({ path: "broker", select: "_id username pp phone email role" })
    .sort({ "schedule.startAt": 1, updatedAt: -1 })
    .limit(300)
    .lean();

  const ownerIds = [...new Set(visits.map((v) => String(v.propId?.owner || "")).filter(Boolean))];
  const owners = await UserModel.find({ _id: { $in: ownerIds } }).select("_id username pp phone email").lean();
  const ownerMap = new Map(owners.map((o) => [String(o._id), o]));
  return visits.map((v) =>
    serializeVisit(v, ownerMap.get(String(v.propId?.owner)) || null, "broker", { brokerCanSeeContact: true }),
  );
}

async function claimVisit(id, brokerId) {
  const broker = await loadBroker(brokerId);
  const updated = await transition(
    id,
    { visitStatus: "owner_approved", broker: null, active: true },
    {
      $set: { visitStatus: "claimed", broker: broker._id, claimedAt: new Date() },
      $push: { timeline: timelineEntry("claimed", "broker", broker._id) },
    },
    "Another broker already claimed this visit.",
  );
  await BrokerModel.updateOne({ _id: broker._id }, { $addToSet: { brokings: updated._id } });

  const owner = await loadOwner(updated.propId);
  const title = updated.propId?.title || "the property";
  await notifyParties(
    updated,
    owner,
    {
      kind: K.VISIT_CLAIMED,
      all: {
        title: "Broker assigned",
        body: `${broker.username} will coordinate your visit to "${title}" and share a time soon.`,
      },
    },
    { broker: false },
  );
  return serializeVisit(updated, owner, "broker", { brokerCanSeeContact: true });
}

async function releaseVisit(id, brokerId, reason = "") {
  const broker = await loadBroker(brokerId);
  const visit = await loadVisit(id);
  assertAssigned(visit, broker);

  const updated = await transition(
    id,
    { visitStatus: "claimed", broker: broker._id },
    {
      $set: { visitStatus: "owner_approved", broker: null, claimedAt: null },
      $push: { timeline: timelineEntry("released", "broker", broker._id, reason) },
    },
    "Only claimed (not yet scheduled) visits can be released.",
  );
  await BrokerModel.updateOne({ _id: broker._id }, { $pull: { brokings: updated._id } });

  const owner = await loadOwner(updated.propId);
  const title = updated.propId?.title || "the property";
  await notifyParties(
    updated,
    owner,
    {
      kind: K.VISIT_RELEASED,
      all: {
        title: "Finding a new broker",
        body: `The broker for "${title}" stepped away. We're assigning someone new.`,
      },
    },
    { broker: false },
  );
  await broadcastToBrokers(
    {
      kind: K.VISIT_POOL_NEW,
      title: "Visit back in the pool",
      body: `"${title}" needs a broker.`,
      propId: updated.propId?._id,
      bookingId: updated._id,
    },
    { excludeId: broker._id },
  ).catch((e) => console.error("broadcastToBrokers:", e.message));

  return serializeVisit(updated, owner, "broker");
}

async function scheduleVisit(id, brokerId, { startAt, durationMin, meetingPoint, notes }) {
  const broker = await loadBroker(brokerId);
  const visit = await loadVisit(id);
  assertAssigned(visit, broker);

  const start = parseFutureDate(startAt, "visit time");
  const duration = Math.min(Math.max(parseInt(durationMin, 10) || 30, 10), 240);
  const isReschedule = visit.visitStatus === "scheduled";
  const lead = start.getTime() - Date.now();

  const updated = await transition(
    id,
    { visitStatus: { $in: ["claimed", "scheduled"] }, broker: broker._id },
    {
      $set: {
        visitStatus: "scheduled",
        status: true,
        date: start.toISOString(),
        "schedule.startAt": start,
        "schedule.durationMin": duration,
        "schedule.meetingPoint": String(meetingPoint || visit.propId?.location || "").slice(0, 300),
        "schedule.notes": String(notes || "").slice(0, 1000),
        // Skip reminders whose window has already passed.
        "reminders.dayBeforeSent": lead <= DAY_MS,
        "reminders.hourBeforeSent": lead <= HOUR_MS,
      },
      $push: {
        timeline: timelineEntry(isReschedule ? "rescheduled" : "scheduled", "broker", broker._id, formatWhen(start)),
      },
    },
    "This visit can't be scheduled in its current state.",
  );

  const owner = await loadOwner(updated.propId);
  const title = updated.propId?.title || "the property";
  const when = formatWhen(start);
  const where = updated.schedule?.meetingPoint ? ` at ${updated.schedule.meetingPoint}` : "";
  await notifyParties(
    updated,
    owner,
    {
      kind: isReschedule ? K.VISIT_RESCHEDULED : K.VISIT_SCHEDULED,
      buyer: {
        title: isReschedule ? "Visit rescheduled" : "Visit scheduled",
        body: `Your visit to "${title}" is on ${when}${where}. Broker: ${broker.username}.`,
      },
      owner: {
        title: isReschedule ? "Visit rescheduled" : "Visit scheduled",
        body: `A buyer will visit "${title}" on ${when}${where}. Broker: ${broker.username}.`,
      },
      broker: {
        title: isReschedule ? "Visit rescheduled" : "Visit scheduled",
        body: `"${title}" on ${when}.`,
      },
    },
    { broker: false },
  );
  return serializeVisit(updated, owner, "broker", { brokerCanSeeContact: true });
}

async function finishVisit(id, brokerId, { outcome = "", noShow = false } = {}) {
  const broker = await loadBroker(brokerId);
  const visit = await loadVisit(id);
  assertAssigned(visit, broker);

  const startAt = visit.schedule?.startAt ? new Date(visit.schedule.startAt).getTime() : null;
  if (visit.visitStatus === "scheduled" && startAt && startAt - Date.now() > HOUR_MS) {
    throw new VisitError(400, "You can mark a visit as done only from an hour before it starts.");
  }

  const nextStatus = noShow ? "no_show" : "completed";
  const updated = await transition(
    id,
    { visitStatus: "scheduled", broker: broker._id },
    {
      $set: { visitStatus: nextStatus, active: false, outcome: String(outcome || "").slice(0, 1000) },
      $push: { timeline: timelineEntry(nextStatus, "broker", broker._id, outcome) },
    },
    "Only scheduled visits can be completed.",
  );
  await detachBooking(updated);

  const owner = await loadOwner(updated.propId);
  const title = updated.propId?.title || "the property";
  await notifyParties(
    updated,
    owner,
    noShow
      ? {
          kind: K.VISIT_NO_SHOW,
          all: { title: "Visit marked as missed", body: `The visit to "${title}" was marked as a no-show.` },
        }
      : {
          kind: K.VISIT_COMPLETED,
          all: { title: "Visit completed", body: `The visit to "${title}" is complete. Thanks for using Propatyc!` },
        },
    { broker: false },
  );
  return serializeVisit(updated, owner, "broker", { brokerCanSeeContact: true });
}

async function reassignVisit(id, superBrokerId, targetBrokerId) {
  const actor = await loadBroker(superBrokerId);
  if (actor.role !== "superbroker") throw new VisitError(403, "Only superbrokers can reassign visits.");
  const target = await loadBroker(targetBrokerId);
  const visit = await loadVisit(id);
  const prevBrokerId = visit.broker?._id || null;

  const updated = await transition(
    id,
    { visitStatus: { $in: ["owner_approved", "claimed", "scheduled"] } },
    {
      $set: {
        broker: target._id,
        claimedAt: new Date(),
        ...(visit.visitStatus === "owner_approved" ? { visitStatus: "claimed" } : {}),
      },
      $push: { timeline: timelineEntry("reassigned", "broker", actor._id, `to ${target.username}`) },
    },
    "This visit can't be reassigned in its current state.",
  );

  await Promise.all([
    prevBrokerId ? BrokerModel.updateOne({ _id: prevBrokerId }, { $pull: { brokings: updated._id } }) : null,
    BrokerModel.updateOne({ _id: target._id }, { $addToSet: { brokings: updated._id } }),
  ]);

  const owner = await loadOwner(updated.propId);
  const title = updated.propId?.title || "the property";
  const jobs = [
    pushBrokerNotification(target._id, {
      kind: K.VISIT_REASSIGNED,
      title: "Visit assigned to you",
      body: `You're now the broker for "${title}".`,
      propId: updated.propId?._id,
      bookingId: updated._id,
    }),
  ];
  if (prevBrokerId && String(prevBrokerId) !== String(target._id)) {
    jobs.push(
      pushBrokerNotification(prevBrokerId, {
        kind: K.VISIT_REASSIGNED,
        title: "Visit reassigned",
        body: `"${title}" was reassigned to another broker.`,
        propId: updated.propId?._id,
        bookingId: updated._id,
      }),
    );
  }
  await Promise.allSettled(jobs);
  await notifyParties(
    updated,
    owner,
    {
      kind: K.VISIT_REASSIGNED,
      all: { title: "New broker assigned", body: `${target.username} is now coordinating the visit to "${title}".` },
    },
    { broker: false },
  );
  return serializeVisit(updated, owner, "broker", { brokerCanSeeContact: true });
}

async function brokerDashboard(brokerId) {
  const broker = await loadBroker(brokerId);
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfDay.getTime() + 7 * DAY_MS);

  const [pool, claimed, scheduled, completed, noShow, upcoming] = await Promise.all([
    BookingModel.countDocuments({ bType: "visit", visitStatus: "owner_approved", broker: null, active: true }),
    BookingModel.countDocuments({ bType: "visit", visitStatus: "claimed", broker: broker._id }),
    BookingModel.countDocuments({ bType: "visit", visitStatus: "scheduled", broker: broker._id }),
    BookingModel.countDocuments({ bType: "visit", visitStatus: "completed", broker: broker._id }),
    BookingModel.countDocuments({ bType: "visit", visitStatus: "no_show", broker: broker._id }),
    listBrokerVisits(broker._id, { status: "scheduled", from: startOfDay, to: endOfWeek }),
  ]);

  return {
    broker: { _id: broker._id, username: broker.username, role: broker.role },
    counts: { pool, claimed, scheduled, completed, noShow },
    upcoming,
  };
}

// ---------------------------------------------------------------------------
// Reminders (run periodically from app.js)
// ---------------------------------------------------------------------------

async function sendDueReminders() {
  const now = Date.now();
  const windows = [
    { flag: "reminders.dayBeforeSent", within: DAY_MS, label: "tomorrow" },
    { flag: "reminders.hourBeforeSent", within: HOUR_MS, label: "in about an hour" },
  ];

  for (const w of windows) {
    // Claim reminders one at a time with an atomic flag flip so multiple
    // workers never send the same reminder twice.
    for (let i = 0; i < 50; i += 1) {
      const doc = await BookingModel.findOneAndUpdate(
        {
          bType: "visit",
          visitStatus: "scheduled",
          [w.flag]: { $ne: true },
          "schedule.startAt": { $gt: new Date(now), $lte: new Date(now + w.within) },
        },
        { $set: { [w.flag]: true } },
        { new: true },
      ).select("_id");
      if (!doc) break;

      try {
        const visit = await loadVisit(doc._id);
        const owner = await loadOwner(visit.propId);
        const title = visit.propId?.title || "the property";
        const when = formatWhen(visit.schedule.startAt);
        const where = visit.schedule?.meetingPoint ? ` at ${visit.schedule.meetingPoint}` : "";
        await notifyParties(visit, owner, {
          kind: K.VISIT_REMINDER,
          all: { title: `Visit ${w.label}`, body: `"${title}" · ${when}${where}` },
        });
      } catch (e) {
        console.error("reminder failed:", e.message);
      }
    }
  }
}

let reminderTimer = null;
function startReminderLoop(intervalMs = 60 * 1000) {
  if (reminderTimer) return;
  reminderTimer = setInterval(() => {
    sendDueReminders().catch((e) => console.error("sendDueReminders:", e.message));
  }, intervalMs);
  reminderTimer.unref?.();
}

// ---------------------------------------------------------------------------
// One-off, idempotent data upgrade for legacy visit bookings
// ---------------------------------------------------------------------------

async function migrateLegacyVisits() {
  const base = { bType: "visit", visitStatus: { $exists: false } };
  const [cancelled, approved, requested] = await Promise.all([
    BookingModel.updateMany({ ...base, active: false }, { $set: { visitStatus: "cancelled" } }),
    BookingModel.updateMany({ ...base, active: true, status: true }, { $set: { visitStatus: "owner_approved" } }),
    BookingModel.updateMany({ ...base, active: true, status: { $ne: true } }, { $set: { visitStatus: "requested" } }),
  ]);
  const n = cancelled.modifiedCount + approved.modifiedCount + requested.modifiedCount;
  if (n) console.log(`[migrate] upgraded ${n} legacy visit bookings`);
}

/** Express helper: translate VisitError to an HTTP response. */
function handleVisitError(res, err, label) {
  if (err instanceof VisitError) {
    return res.status(err.status).json({ message: err.message, code: err.code });
  }
  console.error(label, err?.message || err);
  return res.status(500).json({
    message: "Something went wrong.",
    ...(process.env.NODE_ENV === "development" && err?.message ? { detail: err.message } : {}),
  });
}

module.exports = {
  VisitError,
  createVisit,
  getVisitForUser,
  listVisitsForUser,
  ownerDecision,
  cancelVisit,
  getVisitForBroker,
  listPool,
  listBrokerVisits,
  claimVisit,
  releaseVisit,
  scheduleVisit,
  finishVisit,
  reassignVisit,
  brokerDashboard,
  sendDueReminders,
  startReminderLoop,
  migrateLegacyVisits,
  handleVisitError,
  serializeVisit,
};
