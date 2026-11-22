const express = require("express");
const router = express.Router();

const {
  getPaymentConfig,
  initiatePayment,
  CreatePayment,
  verifyEsewa,
  verifyKhalti,
  getBookingPayment,
} = require("../Controllers/Payment");
const { requireUserAuth } = require("../middleware/requireAuth");

router.get("/config", getPaymentConfig);
router.post("/initiate", requireUserAuth, initiatePayment);
router.post("/create-payment", requireUserAuth, CreatePayment);
router.post("/verify/esewa", verifyEsewa);
router.post("/verify/khalti", verifyKhalti);
router.get("/booking/:bookingId", requireUserAuth, getBookingPayment);

module.exports = router;
