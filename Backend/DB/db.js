// DB/db.js
const mongoose = require("mongoose");
require("dotenv").config();

async function connectDB() {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log(`MongoDB already connected (PID: ${process.pid})`);
      return;
    }

    await mongoose.connect(process.env.DB, {
      maxPoolSize: 5, // keep small pool per worker
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
      autoIndex: false, // disable auto index builds in production
    });

    console.log(`MongoDB connected (PID: ${process.pid})`);
  } catch (err) {
    console.error(
      `MongoDB connection error in worker ${process.pid}:`,
      err.message
    );
    process.exit(1);
  }

  // Handle disconnections
  mongoose.connection.on("disconnected", () => {
    console.warn(`MongoDB disconnected (PID: ${process.pid})`);
  });

  mongoose.connection.on("reconnected", () => {
    console.log(`MongoDB reconnected (PID: ${process.pid})`);
  });
}

async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log(`MongoDB disconnected cleanly (PID: ${process.pid})`);
  }
}

module.exports = { connectDB, disconnectDB };
