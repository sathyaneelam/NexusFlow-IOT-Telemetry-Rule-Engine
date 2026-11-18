
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

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

module.exports = app;
