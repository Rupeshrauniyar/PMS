// DB/db.js
const mongoose = require("mongoose");
require("dotenv").config();

async function connectDB() {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log(`MongoDB already connected (PID: ${process.pid})`);
      return;
    }

    if (!process.env.DB || !String(process.env.DB).trim()) {
      console.error(
        `MongoDB: missing DB connection string in .env (PID: ${process.pid})`,
      );
      process.exit(1);
      return undefined;
    }

    await mongoose.connect(process.env.DB, {
      maxPoolSize: 5, // keep small pool per worker
      minPoolSize: 2,
      serverSelectionTimeoutMS: Number(process.env.DB_SERVER_SELECTION_MS) || 12000,
      socketTimeoutMS: 45000,
      family: 4,
      autoIndex: false, // disable auto index builds in production
    });

    console.log(`MongoDB connected (PID: ${process.pid})`);
  } catch (err) {
    console.error(`MongoDB connection error in worker ${process.pid}:`, err);
    if (
      String(err?.message || "").includes("whitelist") ||
      String(err?.message || "").includes("IP")
    ) {
      console.error(
        "[MongoDB Atlas] Allow your current IP under Network Access, or connect via VPN / Atlas Data API.",
      );
    }
    if (String(err?.message || "").includes("authentication failed")) {
      console.error("[MongoDB] Check DB username/password and database user permissions.");
    }
    console.error('[MongoDB] Set DB=mongodb+srv://... or local mongodb://127.0.0.1:27017/name in Backend/.env');
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
