const express = require("express");
const router = express.Router();
const {
  bookProperty,
  saveProperty,
  canclePropertyBooking,
  confirmPropertyBooking,
} = require("../Controllers/Booking");

router.post("/book", bookProperty);
router.post("/cancel-booking", canclePropertyBooking);
router.post("/confirm-booking", confirmPropertyBooking);
router.post("/save-property", saveProperty);

module.exports = router;
