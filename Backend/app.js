// Server Setup
const express = require("express");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const compression = require("compression");
const cors = require("cors");
const fetch = require("node-fetch");
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["1.1.1.1", "8.8.8.8"]);
require("dotenv").config();

const { assertJwtSecret } = require("./utils/authHelpers");
assertJwtSecret();

// Import services
const { connectDB, disconnectDB } = require("./DB/db");
// const { connectRedis, disconnectRedis } = require("./DB/Redis");

// Express app setup
const app = express();
const port = process.env.PORT || 3000;

// --- Middlewares ---
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(compression());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

const allowedOrigins = [
  process.env.FRONTEND1,
  process.env.FRONTEND2,
  process.env.FRONTEND3,
].filter((o) => typeof o === "string" && o.length > 0);

const nodeEnv = process.env.NODE_ENV || "development";

function isLoopbackBrowserOrigin(origin) {
  try {
    const u = new URL(origin);
    if (!(u.protocol === "http:" || u.protocol === "https:")) return false;
    const h = u.hostname.toLowerCase();
    return (
      h === "localhost" || h === "127.0.0.1" || h === "::1" || h === "[::1]"
    );
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin))
        return cb(null, true);
      if (
        nodeEnv !== "production" &&
        typeof origin === "string" &&
        isLoopbackBrowserOrigin(origin)
      )
        return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

// --- Routes ---
const authRoutes = require("./Routes/Auth");
const propertyRoutes = require("./Routes/Property");
const bookingRoutes = require("./Routes/Booking");
const fetchPropertyRoutes = require("./Routes/FetchingProperty");
const paymentRoutes = require("./Routes/Payment");
const emailRoutes = require("./Routes/Cred");
const androidRoutes = require("./Routes/Android");

// Broker Routes
const brokerauthRoutes = require("./Routes/Broker/Auth");
const fetchBroking = require("./Routes/Broker/FetchBroking");

// // --- Keep Alive Function ---
// const makeActive = async () => {
//   try {
//     const resp = await fetch(process.env.BACKEND);
//     if (resp.ok)
//       console.log("Server reloaded:", new Date().toLocaleTimeString());
//   } catch (err) {
//     console.error("Keep-alive failed:", err.message);
//   }
// };
// setInterval(makeActive, 300_000); // every 5 minutes

(async () => {
  try {
    await connectDB(); // MongoDB connection — required for the API

    // try {
    //   await connectRedis(); // Redis: cache invalidation paths use try/catch; optional at boot
    // } catch (redisErr) {
    //   console.warn(
    //     `[PID ${process.pid}] Redis unavailable (continuing):`,
    //     redisErr?.message || redisErr,
    //   );
    // }
    // async function gracefulShutdown() {
    //   try {
    //     await disconnectDB();
    //   } catch (_) {
    //     /* ignore */
    //   }
    //   try {
    //     await disconnectRedis();
    //   } catch (_) {
    //     /* Redis may never have connected */
    //   }
    //   process.exit(0);
    // }

    // process.on("SIGTERM", () => gracefulShutdown());
    // process.on("SIGINT", () => gracefulShutdown());

    // --- Express setup ---
    app.get("/", (req, res) => {
      res.json(`Welcome to Propatyc. Served by worker #${process.pid}`);
    });

    app.use("/api/auth", authRoutes);
    app.use("/api/android", androidRoutes);
    app.use("/api/cred", emailRoutes);
    app.use("/api/property", propertyRoutes);
    app.use("/api/booking", bookingRoutes);
    app.use("/api/fetching", fetchPropertyRoutes);
    app.use("/api/payment", paymentRoutes);

    app.use("/api/broker/auth", brokerauthRoutes);
    app.use("/api/broker/fetch", fetchBroking);

    // Start server
    app.listen(port, () => {
      console.log(`Worker ${process.pid} listening on port ${port}`);
    });
  } catch (err) {
    console.error(`Worker ${process.pid} failed to start:`, err);
    process.exit(1);
  }
})();
