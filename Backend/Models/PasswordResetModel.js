const mongoose = require("mongoose");
const PassResetSchema = mongoose.Schema({
  token: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
});

const PasswordResetModel = mongoose.model(
  "passwordResetModel",
  PassResetSchema
);
module.exports = PasswordResetModel;
