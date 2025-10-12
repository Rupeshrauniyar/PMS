const express = require("express");
const router = express.Router();
const {
  sendPassResetMail,
  verifyCreds,
  verifyToken,
} = require("../Controllers/Cred");

router.post("/send-pass-reset-mail", sendPassResetMail);
router.post("/forgot-password", verifyCreds);
router.post("/verify-token", verifyToken);

module.exports = router;
