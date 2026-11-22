const visits = require("../../services/visitService");
const BrokerModel = require("../../Models/Broker/UserModel");
const { isValidObjectId, sendServerError } = require("../../utils/authHelpers");

function badId(res) {
  return res.status(400).json({ message: "Invalid visit id." });
}

function wrap(label, fn) {
  return async (req, res) => {
    try {
      if (req.params.id !== undefined && !isValidObjectId(req.params.id)) return badId(res);
      return await fn(req, res);
    } catch (err) {
      return visits.handleVisitError(res, err, label);
    }
  };
}

// GET /api/broker/dashboard
exports.dashboard = wrap("brokerDashboard", async (req, res) => {
  const data = await visits.brokerDashboard(req.userId);
  return res.status(200).json({ success: true, ...data });
});

// GET /api/broker/visits/pool?page=&limit=
exports.pool = wrap("brokerPool", async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const data = await visits.listPool({ page, limit });
  return res.status(200).json({ success: true, ...data });
});

// GET /api/broker/visits/mine?status=open|closed|claimed|scheduled|completed|all&from=&to=
exports.mine = wrap("brokerMine", async (req, res) => {
  const { status, from, to } = req.query;
  const list = await visits.listBrokerVisits(req.userId, { status, from, to });
  return res.status(200).json({ success: true, visits: list });
});

// GET /api/broker/visits/all?status=  (superbroker only)
exports.all = wrap("brokerAll", async (req, res) => {
  if (req.brokerRole !== "superbroker") {
    return res.status(403).json({ message: "Superbroker access required." });
  }
  const { status, from, to } = req.query;
  const list = await visits.listBrokerVisits(req.userId, { status, from, to, all: true });
  return res.status(200).json({ success: true, visits: list });
});

// GET /api/broker/visits/:id
exports.detail = wrap("brokerVisitDetail", async (req, res) => {
  const visit = await visits.getVisitForBroker(req.params.id, req.userId);
  return res.status(200).json({ success: true, visit });
});

exports.claim = wrap("brokerClaim", async (req, res) => {
  const visit = await visits.claimVisit(req.params.id, req.userId);
  return res.status(200).json({ success: true, visit });
});

exports.release = wrap("brokerRelease", async (req, res) => {
  const visit = await visits.releaseVisit(req.params.id, req.userId, req.body?.reason);
  return res.status(200).json({ success: true, visit });
});

// POST /api/broker/visits/:id/schedule { startAt, durationMin, meetingPoint, notes }
exports.schedule = wrap("brokerSchedule", async (req, res) => {
  const visit = await visits.scheduleVisit(req.params.id, req.userId, req.body || {});
  return res.status(200).json({ success: true, visit });
});

exports.complete = wrap("brokerComplete", async (req, res) => {
  const visit = await visits.finishVisit(req.params.id, req.userId, { outcome: req.body?.outcome });
  return res.status(200).json({ success: true, visit });
});

exports.noShow = wrap("brokerNoShow", async (req, res) => {
  const visit = await visits.finishVisit(req.params.id, req.userId, {
    outcome: req.body?.outcome,
    noShow: true,
  });
  return res.status(200).json({ success: true, visit });
});

exports.cancel = wrap("brokerCancel", async (req, res) => {
  const visit = await visits.cancelVisit(req.params.id, {
    actor: "broker",
    actorId: req.userId,
    reason: req.body?.reason,
  });
  return res.status(200).json({ success: true, visit });
});

// POST /api/broker/visits/:id/reassign { brokerId }  (superbroker only)
exports.reassign = wrap("brokerReassign", async (req, res) => {
  const { brokerId } = req.body || {};
  if (!brokerId || !isValidObjectId(brokerId)) {
    return res.status(400).json({ message: "Invalid broker id." });
  }
  const visit = await visits.reassignVisit(req.params.id, req.userId, brokerId);
  return res.status(200).json({ success: true, visit });
});

// GET /api/broker/brokers  (superbroker only) - list brokers for reassignment
exports.listBrokers = async (req, res) => {
  try {
    if (req.brokerRole !== "superbroker") {
      return res.status(403).json({ message: "Superbroker access required." });
    }
    const brokers = await BrokerModel.find({ isActive: { $ne: false } })
      .select("_id username email phone pp role brokings")
      .lean();
    return res.status(200).json({
      success: true,
      brokers: brokers.map(({ brokings, ...b }) => ({ ...b, assigned: brokings?.length ?? 0 })),
    });
  } catch (err) {
    return sendServerError(res, err, "listBrokers");
  }
};
