const crypto = require("crypto");
const SECRET = "8gBm/:&EnhH.1/q"; // eSewa test secret

exports.CreatePayment = async (req, res) => {
  const { amount, id } = req.body;

  const tax_amount = 10;
  const total_amount = Number(amount) + tax_amount;

  const transaction_uuid = `${id}-${Date.now()}`;
  const product_code = "EPAYTEST";

  const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;

  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(message)
    .digest("base64");

  res.json({
    amount,
    tax_amount,
    total_amount,
    transaction_uuid,
    product_code,
    signature,
  });
};
