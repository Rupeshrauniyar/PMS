const express = require("express");
const router = express.Router();
const {
  signup,
  signin,
  signinWithGoogle,
  checkAuth,
  editProfile,
  updateFCM,
} = require("../Controllers/Auth");

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/signinWithGoogle", signinWithGoogle);
router.get("/checkAuth", checkAuth);
router.post("/edit-profile", editProfile);
router.post("/update-fcm-token", updateFCM);


module.exports = router;
