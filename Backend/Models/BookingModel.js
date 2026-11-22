const mongoose = require("mongoose");

/**
 * Visit lifecycle (bType === "visit"):
 *   requested -> owner_approved -> claimed -> scheduled -> completed
 *   requested -> rejected | cancelled
 *   claimed -> owner_approved (broker releases)
 *   scheduled -> cancelled | no_show
 */
const VISIT_STATUSES = Object.freeze([
  "requested",
  "owner_approved",
  "claimed",
  "scheduled",
  "completed",
  "rejected",
  "cancelled",
  "no_show",
]);

/** States in which a visit is still "open" (counts as an active booking). */
const OPEN_VISIT_STATUSES = Object.freeze([
  "requested",
  "owner_approved",
  "claimed",
  "scheduled",
]);

const timelineEntrySchema = mongoose.Schema(
  {
    action: { type: String, required: true },
    by: { type: String, enum: ["buyer", "owner", "broker", "system"], required: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, default: null },
    note: { type: String, default: "" },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const bookingSchema = mongoose.Schema({
  propId: { type: mongoose.Schema.Types.ObjectId, ref: "property" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  price: { type: String, required: true },
  date: {
    type: String,
  },
  note: {
    type: String,
  },
  bType: {
    type: String,
    enum: ["pay", "visit"],
    required: true,
  },
  status: {
    type: Boolean,
    default: false,
  },
  active: {
    type: Boolean,
    default: true,
  },

  // ---- Visit workflow (only meaningful when bType === "visit") ----
  visitStatus: { type: String, enum: VISIT_STATUSES, default: undefined },
  preferredSlots: [{ type: Date }],
  broker: { type: mongoose.Schema.Types.ObjectId, ref: "brokers", default: null },
  claimedAt: { type: Date, default: null },
  schedule: {
    startAt: { type: Date, default: null },
    durationMin: { type: Number, default: 30 },
    meetingPoint: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  reminders: {
    dayBeforeSent: { type: Boolean, default: false },
    hourBeforeSent: { type: Boolean, default: false },
  },
  cancelledBy: {
    type: String,
    enum: ["buyer", "owner", "broker", "system", null],
    default: null,
  },
  outcome: { type: String, default: "" },
  timeline: [timelineEntrySchema],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

bookingSchema.pre("save", function touch(next) {
  this.updatedAt = new Date();
  next();
});

bookingSchema.index({ bType: 1, visitStatus: 1, broker: 1 });
bookingSchema.index({ propId: 1, active: 1 });
bookingSchema.index({ userId: 1, active: 1 });
bookingSchema.index({ "schedule.startAt": 1, visitStatus: 1 });

const BookingModel = mongoose.model("bookings", bookingSchema);

module.exports = BookingModel;
module.exports.VISIT_STATUSES = VISIT_STATUSES;
module.exports.OPEN_VISIT_STATUSES = OPEN_VISIT_STATUSES;
