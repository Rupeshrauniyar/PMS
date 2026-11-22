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

const allowedOrigins = Object.entries(process.env)
  .filter(([k, v]) => /^FRONTEND\d*$/i.test(k) && typeof v === "string" && v.trim().length > 0)
  .map(([, v]) => v.trim().replace(/\/+$/, ""));

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

function isNativeCapacitorOrigin(origin) {
  return (
    origin === "https://localhost" ||
    origin === "http://localhost" ||
    origin === "capacitor://localhost" ||
    origin === "ionic://localhost"
  );
}

app.use(
  cors({
    origin: (origin, cb) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        isNativeCapacitorOrigin(origin)
      )
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
const visitRoutes = require("./Routes/Visit");
const visitService = require("./services/visitService");
const BookingModel = require("./Models/BookingModel");
const PropertyModel = require("./Models/PropertyModel");

// Broker Routes
const brokerauthRoutes = require("./Routes/Broker/Auth");
const brokerVisitRoutes = require("./Routes/Broker/Visits");

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

    // Idempotent startup maintenance: indexes + legacy visit upgrade, then reminders.
    try {
      await Promise.all([BookingModel.createIndexes(), PropertyModel.createIndexes()]);
      await visitService.migrateLegacyVisits();
    } catch (maintErr) {
      console.warn("Startup maintenance skipped:", maintErr?.message || maintErr);
    }
    visitService.startReminderLoop();

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
    app.use("/api/visits", visitRoutes);

    app.use("/api/broker/auth", brokerauthRoutes);
    app.use("/api/broker", brokerVisitRoutes);

    // JSON 404 + error handler (keeps CORS/JSON errors from leaking HTML stack traces)
    app.use((req, res) => res.status(404).json({ message: "Not found." }));
    // eslint-disable-next-line no-unused-vars
    app.use((err, req, res, next) => {
      if (err?.message === "Not allowed by CORS") {
        return res.status(403).json({ message: "Origin not allowed." });
      }
      if (err?.type === "entity.too.large") {
        return res.status(413).json({ message: "Request is too large." });
      }
      console.error("Unhandled error:", err?.message || err);
      return res.status(err?.status || 500).json({ message: "Something went wrong." });
    });

    // Start server
    app.listen(port, () => {
      console.log(`Worker ${process.pid} listening on port ${port}`);
    });
  } catch (err) {
    console.error(`Worker ${process.pid} failed to start:`, err);
    process.exit(1);
  }
})();
