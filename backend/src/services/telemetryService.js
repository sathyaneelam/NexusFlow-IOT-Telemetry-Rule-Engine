const Telemetry = require("../models/Telemetry");

// Save sensor telemetry data
const saveTelemetry = async (telemetryData) => {
  try {
    const telemetry = await Telemetry.create(telemetryData);
    return telemetry;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  saveTelemetry
};