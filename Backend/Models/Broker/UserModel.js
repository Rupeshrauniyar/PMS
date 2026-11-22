const mongoose = require("mongoose");

const notificationEntrySchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    body: { type: String, default: "" },
    kind: { type: String, required: true },
    propId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "property",
      default: null,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "bookings",
      default: null,
    },
    read: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const userSchema = mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    password: { type: String }, // optional if using Google
    uuid: { type: String }, // optional, used for Google OAuth
    authProvider: { type: String, default: "local" }, // 'local' or 'google'
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      minlength: 8,
      maxlength: 15,
      // required: true,
    },
    address: { type: String },
    pp: { type: String }, // profile picture
    role: {
      type: String,
      enum: ["superbroker", "broker"],
      // New sign-ups are regular brokers; promote to superbroker manually in the DB.
      default: "broker",
    },
    isActive: { type: Boolean, default: true },
    brokings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "bookings",
      },
    ],
    FCMtokens: [{ type: String }],
    notifications: [notificationEntrySchema],
  },
  { timestamps: true },
);

const UserModel = mongoose.model("brokers", userSchema);

module.exports = UserModel;
