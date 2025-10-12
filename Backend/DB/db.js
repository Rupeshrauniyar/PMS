const mongoose = require("mongoose");
require("dotenv").config();
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB,);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error(error);
  }
};


module.exports = connectDB;
