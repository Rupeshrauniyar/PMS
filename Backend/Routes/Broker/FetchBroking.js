const express = require("express");
const router = express.Router();
const { fetchBrokings } = require("../../Controllers/Broker/FetchBrokings");
console.log(fetchBrokings);
router.get("/broking", fetchBrokings);

module.exports = router;
