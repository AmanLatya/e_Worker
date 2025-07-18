require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

const authRoutes = require("./routes/auth");
const workerRoutes = require("./routes/worker");
const meRoutes = require("./routes/me");
const requestRoutes = require("./routes/request-routes");
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }))


// MongoDB connection
const connectToDB = require("./db/db");
connectToDB();

// Routes
app.use("/auth", authRoutes);
app.use("/worker", workerRoutes);
app.use("/me", meRoutes);
app.use("/request", requestRoutes);

app.use("/", (req, res) => {
  res.json({ message: "Welcome to eWorker API" });
});

module.exports = app;