const crypto = require("crypto");
const BookingModel = require("../Models/BookingModel");
const { isValidObjectId, sendServerError } = require("../utils/authHelpers");

const SECRET =
  process.env.ESEWA_HMAC_SECRET ||
  process.env.PAYMENT_HMAC_SECRET;

exports.CreatePayment = async (req, res) => {
  try {
    if (!SECRET) {
      console.error(
        "Missing ESEWA_HMAC_SECRET or PAYMENT_HMAC_SECRET — set one in environment.",
      );
      return res.status(503).json({
        message: "Payment signing is not configured on the server.",
      });
    }

    const { amount, id } = req.body;
    const userId = req.userId;

    if (amount == null || !id) {
      return res
        .status(400)
        .json({ message: "amount and booking id are required." });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid booking id." });
    }

    const booking = await BookingModel.findById(id).lean();
    if (!booking || !booking.active || !booking.status) {
      return res.status(400).json({ message: "Invalid Booking" });
    }

    if (String(booking.userId) !== String(userId)) {
      return res
        .status(403)
        .json({ message: "Not allowed to pay for this booking." });
    }

    const tax_amount = 0;
    const total_amount = Number(amount) + tax_amount;
    if (!Number.isFinite(total_amount) || total_amount <= 0) {
      return res.status(400).json({ message: "Invalid amount." });
    }

    const transaction_uuid = `${id}-${Date.now()}`;
    const product_code = process.env.ESEWA_PRODUCT_CODE || "EPAYTEST";

    const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;

    const signature = crypto
      .createHmac("sha256", SECRET)
      .update(message)
      .digest("base64");

    return res.json({
      amount,
      tax_amount,
      total_amount,
      transaction_uuid,
      product_code,
      signature,
    });
  } catch (err) {
    return sendServerError(res, err, "CreatePayment");
  }
};
