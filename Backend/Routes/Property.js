const express = require("express");
const router = express.Router();
const {
  addProperty,

  deleteProperty,
} = require("../Controllers/Property");
const multer = require("multer");
const { requireUserAuth } = require("../middleware/requireAuth");
const storage = multer.memoryStorage();
const upload = multer({ storage });


router.post("/add-property", requireUserAuth, upload.array("images"), addProperty);
router.post("/delete-property", requireUserAuth, deleteProperty);

module.exports = router;
