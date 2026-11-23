/**
 * Helper to validate a single telemetry reading.
 * Used by single ingestion and bulk ingestion.
 *
 * @param {object} reading
 * @returns {{ valid: boolean, message?: string }}
 */
const validateSingleReading = (reading) => {
  if (!reading || typeof reading !== "object" || Array.isArray(reading)) {
    return { valid: false, message: "Payload must be a non-empty object" };
  }

  // Validate deviceId
  if (!reading.deviceId || typeof reading.deviceId !== "string" || !reading.deviceId.trim()) {
    return { valid: false, message: "Missing or invalid required field: deviceId (must be a non-empty string)" };
  }

  // Validate sensorId
  if (!reading.sensorId || typeof reading.sensorId !== "string" || !reading.sensorId.trim()) {
    return { valid: false, message: "Missing or invalid required field: sensorId (must be a non-empty string)" };
  }

  // Validate timestamp if provided
  if (reading.timestamp !== undefined && reading.timestamp !== null) {
    const parsedDate = new Date(reading.timestamp);
    if (isNaN(parsedDate.getTime())) {
      return { valid: false, message: "Invalid timestamp: must be a valid ISO-8601 date string or timestamp" };
    }
  }

  // Validate measurements
  if (!reading.measurements || typeof reading.measurements !== "object" || Array.isArray(reading.measurements)) {
    return { valid: false, message: "Missing or invalid required field: measurements (must be an object)" };
  }

  const measurementKeys = Object.keys(reading.measurements);
  if (measurementKeys.length === 0) {
    return { valid: false, message: "measurements object must contain at least one sensor reading" };
  }

  for (const key of measurementKeys) {
    const val = reading.measurements[key];
    if (typeof val !== "number" || isNaN(val) || !isFinite(val)) {
      return { valid: false, message: `Measurement value for '${key}' must be a valid finite number` };
    }
  }

  return { valid: true };
};

/**
 * Express middleware for validating single telemetry ingestion requests.
 */
const validateTelemetry = (req, res, next) => {
  const result = validateSingleReading(req.body);
  if (!result.valid) {
    return res.status(400).json({
      success: false,
      error: "ValidationError",
      message: result.message,
    });
  }
  next();
};

/**
 * Express middleware for validating bulk telemetry ingestion requests.
 * Accepts either { readings: [...] } or direct [...] array.
 */
const validateBulkTelemetry = (req, res, next) => {
  const rawList = Array.isArray(req.body)
    ? req.body
    : req.body && Array.isArray(req.body.readings)
    ? req.body.readings
    : null;

  if (!rawList) {
    return res.status(400).json({
      success: false,
      error: "ValidationError",
      message: "Bulk payload must be an array of readings or an object with a 'readings' array",
    });
  }

  if (rawList.length === 0) {
    return res.status(400).json({
      success: false,
      error: "ValidationError",
      message: "Bulk telemetry array cannot be empty",
    });
  }

  if (rawList.length > 5000) {
    return res.status(400).json({
      success: false,
      error: "ValidationError",
      message: "Batch size exceeds maximum limit of 5,000 readings per request",
    });
  }

  // Validate each reading in batch
  for (let i = 0; i < rawList.length; i++) {
    const check = validateSingleReading(rawList[i]);
    if (!check.valid) {
      return res.status(400).json({
        success: false,
        error: "ValidationError",
        message: `Invalid reading at index [${i}]: ${check.message}`,
        index: i,
      });
    }
  }

  req.readings = rawList;
  next();
};

module.exports = validateTelemetry;
module.exports.validateSingleReading = validateSingleReading;
module.exports.validateBulkTelemetry = validateBulkTelemetry;
