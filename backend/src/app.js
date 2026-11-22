const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const telemetryRoutes = require("./routes/telemetryRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Security and middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check API
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "NexusFlow backend is running successfully"
  });
});

// Telemetry module routes
app.use("/api/telemetry", telemetryRoutes);

// Centralized error handling middleware
app.use(errorHandler);

module.exports = app;
