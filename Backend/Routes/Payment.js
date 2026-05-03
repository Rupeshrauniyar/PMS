const express = require("express");
const router = express.Router();

const { CreatePayment } = require("../Controllers/Payment");
const { requireUserAuth } = require("../middleware/requireAuth");

router.post("/create-payment", requireUserAuth, CreatePayment);

module.exports = router;
