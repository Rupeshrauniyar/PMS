const express = require("express");
const router = express.Router();
const {
  addProperty,

  deleteProperty,
} = require("../Controllers/Property");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });


router.post("/add-property", upload.array("images"), addProperty);
router.post("/delete-property", deleteProperty);

module.exports = router;
