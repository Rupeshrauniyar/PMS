const express = require("express");
const router = express.Router();
const c = require("../Controllers/Visit");
const { requireUserAuth } = require("../middleware/requireAuth");

router.use(requireUserAuth);

router.post("/", c.requestVisit);
router.get("/", c.listMyVisits);
router.get("/:id", c.getVisit);
router.post("/:id/approve", c.approveVisit);
router.post("/:id/reject", c.rejectVisit);
router.post("/:id/cancel", c.cancelVisit);

module.exports = router;
