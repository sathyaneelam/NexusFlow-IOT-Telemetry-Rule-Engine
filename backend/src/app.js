
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const telemetryRoutes = require("./routes/telemetryRoutes");
const app = express();

// Security and middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use("/api/telemetry", telemetryRoutes);
// Health check API
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "NexusFlow backend is running successfully"
  });
});

module.exports = app;
