// Server Setup
const express = require("express");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const compression = require("compression");
const cors = require("cors");
const fetch = require("node-fetch");

require("dotenv").config();

// Import services
const { connectDB, disconnectDB } = require("./DB/db");
const { connectRedis, disconnectRedis } = require("./DB/Redis");

// Express app setup
const app = express();
const port = process.env.PORT || 3000;

// --- Middlewares ---
app.use(helmet());
app.use(compression());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

const allowedOrigins = [
  process.env.FRONTEND1,
  process.env.FRONTEND2,
  process.env.FRONTEND3,
];
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) cb(null, true);
      else cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// --- Routes ---
const authRoutes = require("./Routes/Auth");
const propertyRoutes = require("./Routes/Property");
const bookingRoutes = require("./Routes/Booking");
const fetchPropertyRoutes = require("./Routes/FetchingProperty");

const emailRoutes = require("./Routes/Cred");
const androidRoutes = require("./Routes/Android");
// --- Keep Alive Function ---
const makeActive = async () => {
  try {
    const resp = await fetch(process.env.BACKEND);
    if (resp.ok)
      console.log("Server reloaded:", new Date().toLocaleTimeString());
  } catch (err) {
    console.error("Keep-alive failed:", err.message);
  }
};
setInterval(makeActive, 300_000); // every 5 minutes

(async () => {
  try {
    await connectDB(); // MongoDB connection
    await connectRedis(); // Redis connection
    process.on("SIGTERM", async () => {
      await disconnectDB();
      await disconnectRedis();
      process.exit(0);
    });

    process.on("SIGINT", async () => {
      await disconnectDB();
      await disconnectRedis();
      process.exit(0);
    });

    // --- Express setup ---
    app.get("/", (req, res) => {
      res.json(`Welcome to PMS. Served by worker #${process.pid}`);
    });

    app.use("/api/auth", authRoutes);
    app.use("/api/android", androidRoutes);
    app.use("/api/cred", emailRoutes);
    app.use("/api/property", propertyRoutes);
    app.use("/api/booking", bookingRoutes);
    app.use("/api/fetching", fetchPropertyRoutes);

    // Start server
    app.listen(port, () => {
      console.log(`Worker ${process.pid} listening on port ${port}`);
    });
  } catch (err) {
    console.error(`Worker ${process.pid} failed to start:`, err);
    process.exit(1);
  }
})();
