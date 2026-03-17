const express = require("express");
const router = express.Router();

const {CreatePayment} = require("../Controllers/Payment");

router.post("/create-payment", CreatePayment);

module.exports = router;
