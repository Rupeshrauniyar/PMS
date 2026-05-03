const BookingModel = require("../../Models/BookingModel");

exports.fetchBrokings = async (req, res) => {
  try {
    const { type } = req.query;

    const query = { active: true };
    if (type && type !== "all") {
      if (type !== "pay" && type !== "visit") {
        return res.status(400).json({ err: "Invalid type. Use pay, visit, or all." });
      }
      query.bType = type;
    }

    const brokings = await BookingModel.find(query)
      .populate("propId")
      .sort({ createdAt: -1 });

    return res.status(200).json({ brokings });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ err: "Something went wrong." });
  }
};
