const express = require("express");
const router = express.Router();
const validateTelemetry = require("../middleware/validateTelemetry");
const telemetryController = require("../controllers/telemetryController");

// POST /api/telemetry - Ingest a single telemetry reading
router.post("/", validateTelemetry, telemetryController.ingestReading);

module.exports = router;
