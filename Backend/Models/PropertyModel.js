const mongoose = require("mongoose");
const { UserModel } = require("./UserModel");

const PropertySchema = mongoose.Schema(
  {
    images: [
      {
        type: String,
      },
    ],
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    rooms: {
      type: String,
      required: true,
    },
    washrooms: {
      type: String,
      required: true,
    },
    sellingType: {
      type: String,
      required: true,
      enum: ["Rent System", "Selling System"],
    },
    propertyType: {
      type: String,
      required: true,
      enum: ["House", "Room", "Plot"],
    },
    price: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    area: {
      type: String,
      required: false,
    },
    status: {
      type: Boolean,
      default: false,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "users", // single User collection
    },
    bookers: [
      {
        price: {
          type: String,
          required: true,
        },
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: "users", // single User collection
        },
        date: {
          type: String,
        },
        note: {
          type: String,
        },
        bType: {
          type: String,
          enum: ["pay", "visit"],
        },
        status: {
          type: Boolean,
          default: false,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

const PropertyModel = mongoose.model("property", PropertySchema);
module.exports = PropertyModel;
