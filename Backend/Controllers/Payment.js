const crypto = require("crypto");
const SECRET = "8gBm/:&EnhH.1/q"; // eSewa test secret
const BookingModel = require("../Models/BookingModel");
exports.CreatePayment = async (req, res) => {
  const { amount, id } = req.body;
  const Booking = await BookingModel.findById(id);
  if (!Booking || !Booking.active || !Booking.status) {
    return res.status(400).json({ message: "Invalid Booking" });
  }
  const total_amount = Number(amount);

  const transaction_uuid = `${id}-${Date.now()}`;
  const product_code = "EPAYTEST";

  const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;

  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(message)
    .digest("base64");

  res.json({
    amount,
    total_amount,
    transaction_uuid,
    product_code,
    signature,
  });
};
