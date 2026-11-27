const { Subject } = require("rxjs");
const { filter, map } = require("rxjs/operators");

/**
 * Normalizes a telemetry document or payload into a standard event schema.
 *
 * @param {object} item - Raw or formatted telemetry item
 * @returns {object|null} Normalized telemetry event
 */
const normalizeTelemetryEvent = (item) => {
  if (!item || typeof item !== "object") return null;

  const deviceId = item.metadata ? item.metadata.deviceId : item.deviceId;
  const sensorId = item.metadata ? item.metadata.sensorId : item.sensorId;

  if (!deviceId || !sensorId) return null;

  let measurements = item.measurements || {};
  if (measurements instanceof Map) {
    measurements = Object.fromEntries(measurements);
  } else if (typeof measurements !== "object") {
    measurements = {};
  }

  const timestamp = item.timestamp
    ? item.timestamp instanceof Date
      ? item.timestamp.toISOString()
      : String(item.timestamp)
    : new Date().toISOString();

  return {
    id: item.id || (item._id ? item._id.toString() : undefined),
    deviceId: String(deviceId).trim(),
    sensorId: String(sensorId).trim(),
    timestamp,
    measurements,
  };
};

// Global singleton reactive stream subject
let telemetrySubject$ = new Subject();

/**
 * Publishes a single telemetry reading to the reactive RxJS event stream.
 *
 * @param {object} reading - Raw or formatted telemetry object
 * @returns {object|null} Emitted telemetry event or null if invalid
 */
const publishTelemetry = (reading) => {
  const event = normalizeTelemetryEvent(reading);
  if (!event) return null;

  telemetrySubject$.next(event);
  return event;
};

/**
 * Publishes an array of telemetry readings sequentially to the reactive stream.
 *
 * @param {Array<object>} readings - Array of telemetry objects
 * @returns {number} Number of successfully emitted events
 */
const publishBulkTelemetry = (readings) => {
  if (!Array.isArray(readings)) return 0;

  let publishedCount = 0;
  for (const reading of readings) {
    const event = publishTelemetry(reading);
    if (event) publishedCount++;
  }
  return publishedCount;
};

/**
 * Exposes the global telemetry stream observable.
 *
 * @returns {Observable<object>} Observable emitting all live telemetry events
 */
const getTelemetryStream = () => {
  return telemetrySubject$.asObservable();
};

/**
 * Filters the telemetry stream for a specific sensor.
 *
 * @param {string} sensorId - Target sensor identifier
 * @returns {Observable<object>} Filtered Observable
 */
const getSensorStream = (sensorId) => {
  const target = String(sensorId).trim();
  return telemetrySubject$.asObservable().pipe(
    filter((event) => event.sensorId === target)
  );
};

/**
 * Filters the telemetry stream for a specific device.
 *
 * @param {string} deviceId - Target device identifier
 * @returns {Observable<object>} Filtered Observable
 */
const getDeviceStream = (deviceId) => {
  const target = String(deviceId).trim();
  return telemetrySubject$.asObservable().pipe(
    filter((event) => event.deviceId === target)
  );
};

/**
 * Creates a reactive stream that emits breach events when a measurement
 * violates a specified threshold rule.
 *
 * @param {string} metric - Measurement field key (e.g. 'temperature', 'humidity')
 * @param {number} threshold - Numerical threshold value
 * @param {string} [operator='>'] - Comparison operator ('>', '>=', '<', '<=', '==')
 * @returns {Observable<object>} Stream of breach alert objects
 */
const getMetricThresholdStream = (metric, threshold, operator = ">") => {
  const targetMetric = String(metric).trim();
  const targetThreshold = Number(threshold);

  return telemetrySubject$.asObservable().pipe(
    filter((event) => {
      if (!event.measurements || event.measurements[targetMetric] === undefined) {
        return false;
      }
      const val = Number(event.measurements[targetMetric]);
      if (isNaN(val)) return false;

      switch (operator) {
        case ">":
          return val > targetThreshold;
        case ">=":
          return val >= targetThreshold;
        case "<":
          return val < targetThreshold;
        case "<=":
          return val <= targetThreshold;
        case "==":
        case "===":
          return val === targetThreshold;
        default:
          return val > targetThreshold;
      }
    }),
    map((event) => ({
      ...event,
      breach: {
        metric: targetMetric,
        value: Number(event.measurements[targetMetric]),
        threshold: targetThreshold,
        operator,
        breachedAt: new Date().toISOString(),
      },
    }))
  );
};

/**
 * Returns the current active subscriber count on the telemetry subject.
 *
 * @returns {number} Active observer count
 */
const getSubscriberCount = () => {
  return telemetrySubject$.observers ? telemetrySubject$.observers.length : 0;
};

/**
 * Resets the stream subject (primarily for test isolation and clean teardown).
 */
const resetStream = () => {
  if (telemetrySubject$ && !telemetrySubject$.closed) {
    telemetrySubject$.complete();
  }
  telemetrySubject$ = new Subject();
};

module.exports = {
  publishTelemetry,
  publishBulkTelemetry,
  getTelemetryStream,
  getSensorStream,
  getDeviceStream,
  getMetricThresholdStream,
  getSubscriberCount,
  resetStream,
  normalizeTelemetryEvent,
};
