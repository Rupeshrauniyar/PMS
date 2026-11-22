const express = require("express");
const router = express.Router();
const c = require("../../Controllers/Broker/Visits");
const { requireBrokerAuth } = require("../../middleware/requireAuth");

router.use(requireBrokerAuth);

router.get("/dashboard", c.dashboard);
router.get("/brokers", c.listBrokers);

router.get("/visits/pool", c.pool);
router.get("/visits/mine", c.mine);
router.get("/visits/all", c.all);
router.get("/visits/:id", c.detail);
router.post("/visits/:id/claim", c.claim);
router.post("/visits/:id/release", c.release);
router.post("/visits/:id/schedule", c.schedule);
router.post("/visits/:id/complete", c.complete);
router.post("/visits/:id/no-show", c.noShow);
router.post("/visits/:id/cancel", c.cancel);
router.post("/visits/:id/reassign", c.reassign);

module.exports = router;
