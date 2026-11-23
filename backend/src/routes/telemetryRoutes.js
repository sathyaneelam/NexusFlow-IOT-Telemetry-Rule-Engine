const express = require("express");
const router = express.Router();
const validateTelemetry = require("../middleware/validateTelemetry");
const { validateBulkTelemetry } = require("../middleware/validateTelemetry");
const telemetryController = require("../controllers/telemetryController");

// POST /api/telemetry/bulk - Ingest readings in bulk
router.post("/bulk", validateBulkTelemetry, telemetryController.ingestBulk);

// POST /api/telemetry - Ingest a single telemetry reading
router.post("/", validateTelemetry, telemetryController.ingestReading);

// GET /api/telemetry - Retrieve telemetry readings with filtering & pagination
router.get("/", telemetryController.getAllTelemetry);

// GET /api/telemetry/:sensorId - Retrieve telemetry for a specific sensor
router.get("/:sensorId", telemetryController.getBySensorId);

module.exports = router;
