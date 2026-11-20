const express = require("express");
const { createTelemetry } = require("../controllers/telemetryController");

const router = express.Router();

// POST /api/telemetry
router.post("/", createTelemetry);

module.exports = router;