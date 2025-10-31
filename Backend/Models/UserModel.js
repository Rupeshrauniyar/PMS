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
      trim: true,
      sparse: true,
      match: [/^\+?[1-9]\d{7,14}$/, "Please enter a valid phone number"],
    },
    address: { type: String },
    pp: { type: String }, // profile picture
    myProperties: [
      {
        propId: { type: mongoose.Schema.Types.ObjectId, ref: "property" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    bookedProperties: [
      {
        propId: { type: mongoose.Schema.Types.ObjectId, ref: "property" },
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
        createdAt: { type: Date, default: Date.now },
      },
    ],
    saved: [
      {
        propId: { type: mongoose.Schema.Types.ObjectId, ref: "property" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    FCMtokens: [{ type: String }],
  },
  { timestamps: true }
);

const UserModel = mongoose.model("users", userSchema);

module.exports = UserModel;
