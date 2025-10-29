// Server Setup
const express = require("express");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const compression = require("compression");
const cors = require("cors");
const fetch = require("node-fetch");
const cluster = require("node:cluster");
const os = require("node:os");
require("dotenv").config();

const numCPUs = os.availableParallelism();

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
const emailRoutes = require("./Routes/Cred");

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

// --- Cluster Setup ---
// if (cluster.isPrimary) {
//   console.log(`Primary ${process.pid} is running`);

//   for (let i = 0; i < numCPUs; i++) {
//     cluster.fork();
//   }

//   cluster.on("exit", (worker) => {
//     console.log(`Worker ${worker.process.pid} died. Restarting...`);
//     cluster.fork(); // auto-restart dead workers
//   });
// } else {
  // Each worker connects separately to DB + Redis
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
      app.use("/api/cred", emailRoutes);
      app.use("/api", propertyRoutes);

      // Start server
      app.listen(port, () => {
        console.log(`Worker ${process.pid} listening on port ${port}`);
      });
    } catch (err) {
      console.error(`Worker ${process.pid} failed to start:`, err);
      process.exit(1);
    }
  })();
// }
