const express = require("express");
const router = express.Router();
const { fetchBrokings } = require("../../Controllers/Broker/FetchBrokings");
const { requireBrokerAuth } = require("../../middleware/requireAuth");
router.get("/broking", requireBrokerAuth, fetchBrokings);

module.exports = router;
