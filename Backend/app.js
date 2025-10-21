// Server Setup
const express = require("express");
const app = express();
// Required Packages
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const compression = require("compression");
const cors = require("cors");
const connectDB = require("./DB/db");
const port = process.env.PORT || 3000;
const axios = require("axios");
require("dotenv").config();
// Middlewares
app.use(helmet());
app.use(compression());
const allowedOrigins = [
  process.env.FRONTEND1, // example: local dev
  process.env.FRONTEND2, // replace with your actual URLs
  process.env.FRONTEND3,
];
app.use(
  cors({
    origin: allowedOrigins,
    // credentials: true, // if you need cookies / auth headers
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
// RequireRoutes
const authRoutes = require("./Routes/Auth");
const propertyRoutes = require("./Routes/Property");
const emailRoutes = require("./Routes/Cred");
// DB Connection
connectDB();
// Server Inactive
const makeActive = async () => {
  try {
    await axios.get(`${process.env.BACKEND}`).then((resp) => {
      console.log("Reloaded",resp.data);
    });
  } catch (err) {
    console.log(err);
  }
};
setInterval(makeActive, 300000);
// Routes
app.get("/", async (req, res) => {
  res.send(
    "<title>PMS Server</title><style>body{background-color: #000000;color: #ffffff;}</style><h4>Welcome to PMS Server</h4>"
  );
});
app.use("/api/auth", authRoutes);
app.use("/api/cred", emailRoutes);
app.use("/api", propertyRoutes);

// Server Initiator
app.listen(port, () => {
  console.log(`Server listening on ${port}`);
});
