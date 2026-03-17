const mongoose = require("mongoose");

const bookingSchema = mongoose.Schema({
  propId: { type: mongoose.Schema.Types.ObjectId, ref: "property" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
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
  active: {
    type: Boolean,
    default: true,
  },
  createdAt: { type: Date, default: Date.now },
});

const BookingModel = mongoose.model("bookings", bookingSchema);

module.exports = BookingModel;
