const express = require("express");
const router = express.Router();
const {
  bookProperty,
  saveProperty,
  canclePropertyBooking,
  confirmPropertyBooking,
  rejectPropertyBooking,
} = require("../Controllers/Booking");
const { requireUserAuth } = require("../middleware/requireAuth");

router.post("/book", requireUserAuth, bookProperty);
router.post("/cancel-booking", requireUserAuth, canclePropertyBooking);
router.post("/confirm-booking", requireUserAuth, confirmPropertyBooking);
router.post("/reject-booking", requireUserAuth, rejectPropertyBooking);
router.post("/save-property", requireUserAuth, saveProperty);

module.exports = router;
