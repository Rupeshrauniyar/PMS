const express = require("express");
const router = express.Router();
const {
  signup,
  signin,
  signinWithGoogle,
  checkAuth,
  editProfile,
  updateFCM, 
  signout,
} = require("../../Controllers/Broker/Auth");
const { requireBrokerAuth } = require("../../middleware/requireAuth");

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/signout", signout);

router.post("/signinWithGoogle", signinWithGoogle);
router.get("/checkAuth", checkAuth);
router.post("/edit-profile", requireBrokerAuth, editProfile);
router.post("/update-fcm-token", requireBrokerAuth, updateFCM);


module.exports = router;
