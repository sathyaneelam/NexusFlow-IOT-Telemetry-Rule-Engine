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

module.exports = {
  createTelemetry,
};
