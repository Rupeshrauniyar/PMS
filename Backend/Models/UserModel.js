const mongoose = require("mongoose");
const { normalizeEmail, canonicalizeEmail } = require("../utils/authHelpers");

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
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    canonicalEmail: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    username: { type: String, required: true },
    password: { type: String }, // optional if created via Google only
    uuid: { type: String, unique: true, sparse: true }, // Google OAuth sub / uid
    authProvider: {
      type: String,
      enum: ["local", "google", "both"],
      default: "local",
    },
    authProviders: {
      type: [{ type: String, enum: ["local", "google"] }],
      default: undefined,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      minlength: 8,
      maxlength: 15,
    },
    address: { type: String },
    pp: { type: String },
    myProperties: [
      {
        propId: { type: mongoose.Schema.Types.ObjectId, ref: "property" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    bookedProperties: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "bookings",
      },
    ],
    saved: [
      {
        propId: { type: mongoose.Schema.Types.ObjectId, ref: "property" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    FCMtokens: [{ type: String }],
    notifications: [notificationEntrySchema],
  },
  { timestamps: true },
);

userSchema.pre("validate", function normalizeUserEmails(next) {
  if (this.email) {
    this.email = normalizeEmail(this.email);
    this.canonicalEmail = canonicalizeEmail(this.email);
  }
  next();
});

const UserModel = mongoose.model("users", userSchema);

module.exports = UserModel;
