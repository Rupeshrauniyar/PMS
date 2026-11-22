const visits = require("../services/visitService");
const { isValidObjectId } = require("../utils/authHelpers");

function badId(res) {
  return res.status(400).json({ message: "Invalid visit id." });
}

// POST /api/visits  { propId, preferredSlots: [ISO], note }
exports.requestVisit = async (req, res) => {
  try {
    const { propId, preferredSlots, note, price } = req.body || {};
    if (!propId || !isValidObjectId(propId)) {
      return res.status(400).json({ message: "Invalid property id." });
    }
    const visit = await visits.createVisit({
      userId: req.userId,
      propId,
      preferredSlots,
      note,
      price,
    });
    return res.status(201).json({ success: true, visit });
  } catch (err) {
    return visits.handleVisitError(res, err, "requestVisit");
  }
};

// GET /api/visits?role=buyer|owner&status=open|closed|all|<visitStatus>
exports.listMyVisits = async (req, res) => {
  try {
    const role = req.query.role === "owner" ? "owner" : "buyer";
    const list = await visits.listVisitsForUser(req.userId, { role, status: req.query.status });
    return res.status(200).json({ success: true, visits: list });
  } catch (err) {
    return visits.handleVisitError(res, err, "listMyVisits");
  }
};

// GET /api/visits/:id
exports.getVisit = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return badId(res);
    const visit = await visits.getVisitForUser(req.params.id, req.userId);
    return res.status(200).json({ success: true, visit });
  } catch (err) {
    return visits.handleVisitError(res, err, "getVisit");
  }
};

// POST /api/visits/:id/approve  { note? }
exports.approveVisit = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return badId(res);
    const visit = await visits.ownerDecision(req.params.id, req.userId, true, req.body?.note);
    return res.status(200).json({ success: true, visit });
  } catch (err) {
    return visits.handleVisitError(res, err, "approveVisit");
  }
};

// POST /api/visits/:id/reject  { note? }
exports.rejectVisit = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return badId(res);
    const visit = await visits.ownerDecision(req.params.id, req.userId, false, req.body?.note);
    return res.status(200).json({ success: true, visit });
  } catch (err) {
    return visits.handleVisitError(res, err, "rejectVisit");
  }
};

// POST /api/visits/:id/cancel  { reason? }
exports.cancelVisit = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return badId(res);
    const visit = await visits.cancelVisit(req.params.id, {
      actor: "user",
      actorId: req.userId,
      reason: req.body?.reason,
    });
    return res.status(200).json({ success: true, visit });
  } catch (err) {
    return visits.handleVisitError(res, err, "cancelVisit");
  }
};
