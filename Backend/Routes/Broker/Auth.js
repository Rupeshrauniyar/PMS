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
  markAllNotificationsRead,
} = require("../../Controllers/Broker/Auth");
const { requireBrokerAuth } = require("../../middleware/requireAuth");

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/signout", signout);

router.post("/signinWithGoogle", signinWithGoogle);
router.get("/checkAuth", checkAuth);
router.post("/edit-profile", requireBrokerAuth, editProfile);
router.post("/update-fcm-token", requireBrokerAuth, updateFCM);

router.get("/notifications", requireBrokerAuth, getNotifications);
router.post("/notifications/read-all", requireBrokerAuth, markAllNotificationsRead);
router.patch("/notifications/:notificationId/read", requireBrokerAuth, markNotificationRead);


module.exports = router;
