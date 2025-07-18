require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

const authRoutes = require("./routes/auth");
const workerRoutes = require("./routes/worker");
const meRoutes = require("./routes/me");
const requestRoutes = require("./routes/request-routes");
// Middleware
// app.use(cors());
app.use(cors({
    origin: ['http://localhost:7000', 'https://your-frontend-domain.com'], // adjust accordingly
    credentials: true
}));

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

app.get("/", (req, res) => {
    res.send("Welcome to eWorker API");
})

module.exports = app;