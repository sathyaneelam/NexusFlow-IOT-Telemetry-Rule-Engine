const { saveTelemetry } = require("../services/telemetryService");

// Handle incoming telemetry data
const createTelemetry = async (req, res) => {
  try {
    const { sensorId, measurements, timestamp } = req.body;

if (
  !sensorId ||
  typeof sensorId !== "string" ||
  !measurements ||
  typeof measurements !== "object" ||
  Array.isArray(measurements) ||
  Object.keys(measurements).length === 0
) {
  return res.status(400).json({
    success: false,
    message: "Valid sensorId and measurements are required"
  });
}

const telemetry = await saveTelemetry({
  sensorId,
  measurements,
  ...(timestamp && { timestamp })
});
    res.status(201).json({
      success: true,
      message: "Telemetry data saved successfully",
      data: telemetry
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createTelemetry
};