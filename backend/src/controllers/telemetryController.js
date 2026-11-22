const telemetryService = require("../services/telemetryService");

/**
 * Controller to handle single telemetry reading ingestion.
 * POST /api/telemetry
 */
const ingestReading = async (req, res, next) => {
  try {
    const savedReading = await telemetryService.createTelemetry(req.body);

    return res.status(201).json({
      success: true,
      message: "Telemetry reading ingested successfully",
      data: savedReading,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  ingestReading,
};
