const express = require("express");
const router = express.Router();
const {
  addProperty,
  getProperty,
  getUserProperty,
  bookProperty,
  searchProperty,
  saveProperty,
  deleteProperty,
} = require("../Controllers/Property");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });
router.post("/add-property", upload.array("images"), addProperty);
router.post("/get-property", getProperty);
router.post("/get-user-property", getUserProperty);
router.post("/book", bookProperty);
router.post("/search", searchProperty);
router.post("/save-property", saveProperty);
router.post("/delete-property", deleteProperty);

module.exports = router;
