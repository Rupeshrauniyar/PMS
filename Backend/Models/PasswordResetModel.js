const mongoose = require("mongoose");

const PassResetSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      // Points at `users` or `brokers` depending on accountType.
    },
    accountType: {
      type: String,
      enum: ["user", "broker"],
      default: "user",
    },
    expiresAt: {
      type: Date,
      required: true, // token expiration
    },
  },
  { timestamps: true }
);

const PasswordResetModel = mongoose.model("passwordResets", PassResetSchema);

module.exports = PasswordResetModel;
