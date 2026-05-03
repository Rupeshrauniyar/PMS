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
  getNotifications,
  markNotificationRead,
} = require("../Controllers/Auth");
const { requireUserAuth } = require("../middleware/requireAuth");

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/signout", signout);

router.post("/signinWithGoogle", signinWithGoogle);
router.get("/checkAuth", checkAuth);
router.get("/notifications", requireUserAuth, getNotifications);
router.patch(
  "/notifications/:notificationId/read",
  requireUserAuth,
  markNotificationRead,
);
router.post("/edit-profile", requireUserAuth, editProfile);
router.post("/update-fcm-token", requireUserAuth, updateFCM);


module.exports = router;
