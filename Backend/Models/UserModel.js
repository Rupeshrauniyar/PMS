const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: false,
    unique: true,
    trim: true,
    match: [/^\+?[1-9]\d{7,14}$/, "Please enter a valid phone number"],
    default: "",
  },
  address: {
    type: String,
  },
  myProperties: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "property",
    },
  ],
  bookedProperties: [
    {
      propId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "property",
      },

      price: {
        type: Number,
        required: true,
      },

      date: {
        type: String,
        required: true,
      },
    },
  ],
  saved: [
    {
      propId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "property",
      },
    },
  ],
  FCMtokens: [{ type: String, unique: true }],
});
const googleUserSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
  },
  uuid: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    required: false,
    unique: true,
    trim: true,
    match: [/^\+?[1-9]\d{7,14}$/, "Please enter a valid phone number"],
    default: "",
  },
  address: {
    type: String,
  },
  pp: {
    type: String,
  },
  myProperties: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "property",
    },
  ],
  bookedProperties: [
    {
      propId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "property",
      },

      price: {
        type: Number,
        required: true,
      },

      date: {
        type: String,
        required: true,
      },
    },
  ],
  saved: [
    {
      propId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "property",
      },
    },
  ],
  FCMtokens: [{ type: String, unique: true }],
});
const UserModel = mongoose.model("users", userSchema);
const GoogleUserModel = mongoose.model("googleUsers", googleUserSchema);
module.exports = { UserModel, GoogleUserModel };
