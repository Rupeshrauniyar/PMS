const express = require("express");
const router = express.Router();
const {
  getProperty,
  getUserProperty,
  searchProperty,
  getBookers,
} = require("../Controllers/FetchingProperty");

router.post("/get-property", getProperty);
router.post("/get-my-prop", getBookers);
router.post("/get-user-property", getUserProperty);
router.post("/search", searchProperty);

module.exports = router;
