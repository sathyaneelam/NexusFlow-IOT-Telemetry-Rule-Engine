const Telemetry = require("../models/Telemetry");

/**
 * Lightweight document formatter for .lean() query results.
 * Bypasses Mongoose Document hydration overhead for high-throughput reads.
 *
 * @param {object} doc - Raw document from MongoDB
 * @returns {object} Clean API-ready object
 */
const formatTelemetryDoc = (doc) => {
  if (!doc) return null;
  const id = doc._id ? doc._id.toString() : doc.id;
  const deviceId = doc.metadata ? doc.metadata.deviceId : doc.deviceId;
  const sensorId = doc.metadata ? doc.metadata.sensorId : doc.sensorId;
  const timestamp = doc.timestamp
    ? doc.timestamp instanceof Date
      ? doc.timestamp.toISOString()
      : doc.timestamp
    : undefined;

  let measurements = doc.measurements || {};
  if (measurements instanceof Map) {
    measurements = Object.fromEntries(measurements);
  }

  return {
    id,
    deviceId,
    sensorId,
    timestamp,
    measurements,
  };
};

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
 * sensorId, date ranges, metric threshold queries, and cursor-based pagination.
 * Utilizes .lean() for minimal memory footprint and fast serialization.
 *
 * @param {object} options
 * @param {string} [options.deviceId]
 * @param {string} [options.sensorId]
 * @param {string|Date} [options.startDate]
 * @param {string|Date} [options.endDate]
 * @param {number} [options.page=1]
 * @param {number} [options.limit=50]
 * @param {string} [options.sort='desc'] - 'asc' or 'desc'
 * @param {string|Date} [options.cursor] - Timestamp cursor for O(1) keyset pagination
 * @param {number} [options.minTemperature]
 * @param {number} [options.maxTemperature]
 * @param {number} [options.minHumidity]
 * @param {number} [options.maxHumidity]
 * @param {number} [options.minPressure]
 * @param {number} [options.maxPressure]
 * @returns {Promise<{ pagination: object, data: Array<object> }>}
 */
const getTelemetry = async (options = {}) => {
  const { deviceId, sensorId, startDate, endDate, cursor } = options;

  const page = Math.max(1, parseInt(options.page, 10) || 1);
  const limit = Math.min(500, Math.max(1, parseInt(options.limit, 10) || 50));
  const skip = (page - 1) * limit;
  const sortOrder = String(options.sort || "").toLowerCase() === "asc" ? 1 : -1;

  // Build query filter
  const query = {};

  if (deviceId) {
    query["metadata.deviceId"] = String(deviceId).trim();
  }

  if (sensorId) {
    query["metadata.sensorId"] = String(sensorId).trim();
  }

  // Timestamp and cursor filters
  const timeFilter = {};
  if (startDate) {
    const s = new Date(startDate);
    if (!isNaN(s.getTime())) timeFilter.$gte = s;
  }
  if (endDate) {
    const e = new Date(endDate);
    if (!isNaN(e.getTime())) timeFilter.$lte = e;
  }
  if (cursor) {
    const c = new Date(cursor);
    if (!isNaN(c.getTime())) {
      if (sortOrder === 1) {
        timeFilter.$gt = c;
      } else {
        timeFilter.$lt = c;
      }
    }
  }
  if (Object.keys(timeFilter).length > 0) {
    query.timestamp = timeFilter;
  }

  // Measurement threshold filters
  const metricConfigs = [
    { key: "temperature", min: options.minTemperature, max: options.maxTemperature },
    { key: "humidity", min: options.minHumidity, max: options.maxHumidity },
    { key: "pressure", min: options.minPressure, max: options.maxPressure },
  ];

  for (const m of metricConfigs) {
    const mFilter = {};
    if (m.min !== undefined && !isNaN(Number(m.min))) {
      mFilter.$gte = Number(m.min);
    }
    if (m.max !== undefined && !isNaN(Number(m.max))) {
      mFilter.$lte = Number(m.max);
    }
    if (Object.keys(mFilter).length > 0) {
      query[`measurements.${m.key}`] = mFilter;
    }
  }

  // Execute query using .lean() when available for zero Mongoose document hydration overhead
  const findQuery = Telemetry.find(query)
    .sort({ timestamp: sortOrder })
    .skip(cursor ? 0 : skip)
    .limit(limit);

  const [total, rawDocs] = await Promise.all([
    Telemetry.countDocuments(query),
    typeof findQuery.lean === "function" ? findQuery.lean() : findQuery,
  ]);

  const formattedData = rawDocs.map(formatTelemetryDoc);
  const nextCursor =
    formattedData.length > 0 ? formattedData[formattedData.length - 1].timestamp : null;

  return {
    pagination: {
      page: cursor ? null : page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      nextCursor,
      hasMore: formattedData.length === limit,
    },
    data: formattedData,
  };
};

/**
 * Retrieves telemetry for a specific sensorId with optional date/metric filtering and pagination.
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
  formatTelemetryDoc,
};
