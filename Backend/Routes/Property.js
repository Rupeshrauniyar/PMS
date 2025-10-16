const express = require("express");
const router = express.Router();
const {
  addProperty,
  getProperty,
  getUserProperty,
  bookProperty,
  searchProperty,
} = require("../Controllers/Property");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });
router.post("/add-property", upload.array("images"), addProperty);
router.post("/get-property", getProperty);
router.post("/get-user-property", getUserProperty);
router.post("/book", bookProperty);
router.post("/search", searchProperty);


module.exports = router;
