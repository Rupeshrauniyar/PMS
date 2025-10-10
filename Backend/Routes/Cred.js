const express = require("express");
const router = express.Router();
const { sendPassResetMail, verifyCreds } = require("../Controllers/Cred");

router.post("/send-pass-reset-mail", sendPassResetMail);
router.post("/forgot-password", verifyCreds);

module.exports = router;
