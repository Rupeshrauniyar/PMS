const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "bookings",
      required: true,
      index: true,
    },
    propId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "property",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      default: null,
    },
    gateway: {
      type: String,
      enum: ["esewa", "khalti", "cash"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    transactionUuid: {
      type: String,
      required: true,
      unique: true,
    },
    pidx: {
      type: String,
      default: null,
      index: true,
    },
    gatewayRef: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["initiated", "completed", "failed", "pay_at_property"],
      default: "initiated",
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    rawPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("payments", paymentSchema);
