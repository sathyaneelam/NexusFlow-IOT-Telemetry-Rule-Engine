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

/**
 * Controller to handle bulk telemetry ingestion with throughput performance tracking.
 * POST /api/telemetry/bulk
 */
const ingestBulk = async (req, res, next) => {
  try {
    const readings = req.readings || req.body.readings || req.body;
    const result = await telemetryService.createBulkTelemetry(readings);

    return res.status(201).json({
      success: true,
      message: "Bulk telemetry ingested successfully",
      count: result.count,
      summary: result.summary,
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to retrieve paginated telemetry readings.
 * Supports filters: deviceId, sensorId, startDate, endDate, sort, cursor, and metric thresholds.
 * GET /api/telemetry
 */
const getAllTelemetry = async (req, res, next) => {
  try {
    const {
      deviceId,
      sensorId,
      startDate,
      endDate,
      page,
      limit,
      sort,
      cursor,
      minTemperature,
      maxTemperature,
      minHumidity,
      maxHumidity,
      minPressure,
      maxPressure,
    } = req.query;

    const result = await telemetryService.getTelemetry({
      deviceId,
      sensorId,
      startDate,
      endDate,
      page,
      limit,
      sort,
      cursor,
      minTemperature,
      maxTemperature,
      minHumidity,
      maxHumidity,
      minPressure,
      maxPressure,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to retrieve the latest telemetry reading for a given sensorId.
 * GET /api/telemetry/:sensorId/latest
 */
const getLatest = async (req, res, next) => {
  try {
    const { sensorId } = req.params;
    const { deviceId } = req.query;

    const latest = await telemetryService.getLatestTelemetry(sensorId, { deviceId });

    if (!latest) {
      return res.status(404).json({
        success: false,
        error: "NotFoundError",
        message: `No telemetry readings found for sensor '${sensorId}'`,
      });
    }

    return res.status(200).json({
      success: true,
      data: latest,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to retrieve historical telemetry for charting and time-series reports.
 * GET /api/telemetry/:sensorId/history
 */
const getHistory = async (req, res, next) => {
  try {
    const { sensorId } = req.params;
    const { deviceId, startDate, endDate, limit, sort } = req.query;

    const result = await telemetryService.getHistoricalTelemetry(sensorId, {
      deviceId,
      startDate,
      endDate,
      limit,
      sort,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to retrieve telemetry by sensorId.
 * GET /api/telemetry/:sensorId
 */
const getBySensorId = async (req, res, next) => {
  try {
    const { sensorId } = req.params;
    const {
      deviceId,
      startDate,
      endDate,
      page,
      limit,
      sort,
      cursor,
      minTemperature,
      maxTemperature,
      minHumidity,
      maxHumidity,
      minPressure,
      maxPressure,
    } = req.query;

    const result = await telemetryService.getTelemetryBySensorId(sensorId, {
      deviceId,
      startDate,
      endDate,
      page,
      limit,
      sort,
      cursor,
      minTemperature,
      maxTemperature,
      minHumidity,
      maxHumidity,
      minPressure,
      maxPressure,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  ingestReading,
  ingestBulk,
  getAllTelemetry,
  getBySensorId,
  getLatest,
  getHistory,
};
