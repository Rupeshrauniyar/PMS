const mongoose = require("mongoose");

const PropertySchema = mongoose.Schema(
  {
    images: [
      {
        type: String,
      },
    ],
    /** Single walkthrough video (Cloudinary). */
    video: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
      thumbnail: { type: String, default: null },
      duration: { type: Number, default: null },
    },
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
    amenities: [{ type: String, trim: true }],
    views: { type: Number, default: 0 },
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
        type: mongoose.Schema.Types.ObjectId,
        ref: "bookings",
      },
    ],
  },
  { timestamps: true },
);

PropertySchema.index({ propertyType: 1, status: 1, createdAt: -1 });
PropertySchema.index({ owner: 1 });

const PropertyModel = mongoose.model("property", PropertySchema);
module.exports = PropertyModel;
