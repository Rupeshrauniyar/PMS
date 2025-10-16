const mongoose = require("mongoose");
const UserModel = require("../Models/UserModel");
const PassResetSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: UserModel,
    },
    userModel: {
      type: String,
      required: true,
      enum: ["users", "googleUsers"], // the collections it can reference
    },
  },
  { timestamps: true }
);

const PasswordResetModel = mongoose.model(
  "passwordResetModel",
  PassResetSchema
);
module.exports = PasswordResetModel;
