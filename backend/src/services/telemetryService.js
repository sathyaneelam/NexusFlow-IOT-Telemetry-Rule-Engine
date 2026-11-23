const Telemetry = require("../models/Telemetry");

/**
 * Persists a single telemetry reading to the MongoDB Time-Series collection.
 *
 * @param {object} payload - Incoming telemetry payload
 * @returns {Promise<object>} Clean serialized JSON representation
 */
const createTelemetry = async (payload) => {
  const formatted = Telemetry.formatIncomingPayload(payload);
  const doc = new Telemetry(formatted);
  await doc.save();
  return doc.toJSON();
};

/**
 * Ingests multiple telemetry readings in bulk using optimized batch write.
 *
 * @param {Array<object>} readings - Array of telemetry readings
 * @returns {Promise<{ count: number, data: Array<object> }>}
 */
const createBulkTelemetry = async (readings) => {
  if (!Array.isArray(readings) || readings.length === 0) {
    throw new Error("Readings must be a non-empty array");
  }

  const formattedDocs = readings.map((r) => Telemetry.formatIncomingPayload(r));

  // High-performance batch insertion into time-series collection
  // ordered: false allows parallel insertion without halting on individual errors
  const insertedDocs = await Telemetry.insertMany(formattedDocs, { ordered: false });

  return {
    count: insertedDocs.length,
    data: insertedDocs.map((doc) => doc.toJSON()),
  };
};

/**
 * Retrieves paginated telemetry readings supporting filters by deviceId,
 * sensorId, and date ranges.
 *
 * @param {object} options
 * @param {string} [options.deviceId]
 * @param {string} [options.sensorId]
 * @param {string|Date} [options.startDate]
 * @param {string|Date} [options.endDate]
 * @param {number} [options.page=1]
 * @param {number} [options.limit=50]
 * @returns {Promise<{ pagination: object, data: Array<object> }>}
 */
const getTelemetry = async (options = {}) => {
  const { deviceId, sensorId, startDate, endDate } = options;

  const page = Math.max(1, parseInt(options.page, 10) || 1);
  const limit = Math.min(500, Math.max(1, parseInt(options.limit, 10) || 50));
  const skip = (page - 1) * limit;

  // Build query
  const query = {};

  if (deviceId) {
    query["metadata.deviceId"] = String(deviceId).trim();
  }

  if (sensorId) {
    query["metadata.sensorId"] = String(sensorId).trim();
  }

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) {
      const s = new Date(startDate);
      if (!isNaN(s.getTime())) query.timestamp.$gte = s;
    }
    if (endDate) {
      const e = new Date(endDate);
      if (!isNaN(e.getTime())) query.timestamp.$lte = e;
    }
  }

  const [total, docs] = await Promise.all([
    Telemetry.countDocuments(query),
    Telemetry.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit),
  ]);

  return {
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
    data: docs.map((d) => d.toJSON()),
  };
};

/**
 * Retrieves telemetry for a specific sensorId with optional date filtering and pagination.
 *
 * @param {string} sensorId
 * @param {object} options
 * @returns {Promise<{ pagination: object, data: Array<object> }>}
 */
const getTelemetryBySensorId = async (sensorId, options = {}) => {
  return getTelemetry({ ...options, sensorId });
};

module.exports = {
  createTelemetry,
  createBulkTelemetry,
  getTelemetry,
  getTelemetryBySensorId,
};
