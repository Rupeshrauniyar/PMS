const BookingModel = require("../../Models/BookingModel");
const jwt = require("jsonwebtoken");
const UserModel = require("../../Models/UserModel");
require("dotenv").config();

exports.fetchBrokings = async (req, res) => {
  try {
    const brokings = await BookingModel.find({ active: true }).populate("propId");
    return res.status(200).json({ brokings })
  } catch (err) {
    console.log(err);
    return res.status(401).json({ err: "Something went wrong." });
  }
};
