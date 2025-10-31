const getAPK = require("../Controllers/Android");
const express = require("express");
const router = express.Router();

router.get("/getapk",getAPK);

module.exports = router;
