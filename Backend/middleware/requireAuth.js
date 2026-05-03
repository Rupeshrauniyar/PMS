const BrokerUserModel = require("../Models/Broker/UserModel");
const { decodeAccessFromRequest } = require("../utils/authHelpers");

function requireUserAuth(req, res, next) {
  const p = decodeAccessFromRequest(req, "user");
  if (!p?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  req.userId = p.id;
  req.accountType = p.type;
  next();
}

async function requireBrokerAuth(req, res, next) {
  try {
    const p = decodeAccessFromRequest(req, "broker");
    if (!p?.id) {
      return res.status(401).json({ err: "Authentication required." });
    }
    const broker = await BrokerUserModel.findById(p.id).select("_id").lean();
    if (!broker) {
      return res.status(403).json({ err: "Forbidden." });
    }
    req.userId = p.id;
    req.accountType = p.type;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  requireUserAuth,
  requireBrokerAuth,
};
