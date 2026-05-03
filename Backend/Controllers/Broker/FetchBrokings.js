const BookingModel = require("../../Models/BookingModel");
const { sendServerError } = require("../../utils/authHelpers");

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

exports.fetchBrokings = async (req, res) => {
  try {
    const { type } = req.query;
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || DEFAULT_LIMIT, 1),
      MAX_LIMIT,
    );
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const skip = (page - 1) * limit;

    const query = { active: true };
    if (type && type !== "all") {
      if (type !== "pay" && type !== "visit") {
        return res
          .status(400)
          .json({ err: "Invalid type. Use pay, visit, or all." });
      }
      query.bType = type;
    }

    const [brokings, total] = await Promise.all([
      BookingModel.find(query)
        .populate({
          path: "propId",
          select: "-bookers",
        })
        .populate({
          path: "userId",
          select: "username email phone",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BookingModel.countDocuments(query),
    ]);

    return res.status(200).json({
      brokings,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    return sendServerError(res, err, "fetchBrokings");
  }
};
