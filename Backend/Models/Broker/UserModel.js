const mongoose = require("mongoose");

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
      default: "superbroker",
    },
    brokings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "bookings",
      },
    ],
    FCMtokens: [{ type: String }],
  },
  { timestamps: true },
);

const UserModel = mongoose.model("brokers", userSchema);

module.exports = UserModel;
