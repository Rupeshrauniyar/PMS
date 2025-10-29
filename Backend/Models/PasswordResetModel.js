const mongoose = require("mongoose");
const { UserModel } = require("../Models/UserModel");

const PassResetSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "users", // single User collection
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
