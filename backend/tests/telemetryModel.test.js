const { test, describe } = require("node:test");
const assert = require("node:assert");
const Telemetry = require("../src/models/Telemetry");

describe("Telemetry Time-Series Model", () => {
  test("schema has correct MongoDB time-series collection options", () => {
    const timeseriesOptions = Telemetry.schema.options.timeseries;
    assert.ok(timeseriesOptions, "timeseries options should be defined on schema");
    assert.strictEqual(timeseriesOptions.timeField, "timestamp");
    assert.strictEqual(timeseriesOptions.metaField, "metadata");
    assert.strictEqual(timeseriesOptions.granularity, "seconds");
  });

  test("validates required fields: deviceId, sensorId", async () => {
    const emptyDoc = new Telemetry({});
    let error;
    try {
      await emptyDoc.validate();
    } catch (err) {
      error = err;
    }
    assert.ok(error, "validation should fail for empty document");
    assert.ok(error.errors["metadata.deviceId"], "metadata.deviceId is required");
    assert.ok(error.errors["metadata.sensorId"], "metadata.sensorId is required");
  });

  test("successfully instantiates with valid sensor payload", async () => {
    const doc = new Telemetry({
      timestamp: new Date("2026-11-21T10:00:00.000Z"),
      metadata: {
        deviceId: "device-001",
        sensorId: "temperature-001",
      },
      measurements: {
        temperature: 24.5,
        humidity: 60.2,
        pressure: 1013.25,
      },
    });

    await assert.doesNotReject(async () => {
      await doc.validate();
    });

    assert.strictEqual(doc.deviceId, "device-001");
    assert.strictEqual(doc.sensorId, "temperature-001");
    assert.strictEqual(doc.measurements.get("temperature"), 24.5);
    assert.strictEqual(doc.measurements.get("humidity"), 60.2);
    assert.strictEqual(doc.measurements.get("pressure"), 1013.25);
  });

  test("supports dynamic custom sensor measurements", async () => {
    const doc = new Telemetry({
      metadata: {
        deviceId: "device-002",
        sensorId: "multi-sensor-001",
      },
      measurements: {
        temperature: 28.1,
        co2: 450,
        lux: 300,
        battery: 98.5,
      },
    });

    await assert.doesNotReject(async () => {
      await doc.validate();
    });

    assert.strictEqual(doc.measurements.get("co2"), 450);
    assert.strictEqual(doc.measurements.get("lux"), 300);
    assert.strictEqual(doc.measurements.get("battery"), 98.5);
  });

  test("rejects invalid non-numeric measurement values", async () => {
    const doc = new Telemetry({
      metadata: {
        deviceId: "device-001",
        sensorId: "temperature-001",
      },
      measurements: {
        temperature: "invalid_temp",
      },
    });

    let error;
    try {
      await doc.validate();
    } catch (err) {
      error = err;
    }

    assert.ok(error, "should fail validation on non-numeric measurement");
    const hasMeasurementError = Object.keys(error.errors).some((k) => k.startsWith("measurements"));
    assert.ok(hasMeasurementError, "should contain measurement validation error");
  });

  test("toJSON flattens metadata and converts measurements Map to plain object", () => {
    const doc = new Telemetry({
      timestamp: new Date("2026-11-21T10:00:00.000Z"),
      metadata: {
        deviceId: "device-001",
        sensorId: "temperature-001",
      },
      measurements: {
        temperature: 25.4,
        humidity: 55.0,
      },
    });

    const json = doc.toJSON();
    assert.strictEqual(json.deviceId, "device-001");
    assert.strictEqual(json.sensorId, "temperature-001");
    assert.strictEqual(json.metadata, undefined);
    assert.strictEqual(json._id, undefined);
    assert.strictEqual(json.measurements.temperature, 25.4);
    assert.strictEqual(json.measurements.humidity, 55.0);
  });

  test("formatIncomingPayload helper formats REST payload into time-series structure", () => {
    const incoming = {
      deviceId: "device-099",
      sensorId: "pressure-001",
      timestamp: "2026-11-21T12:30:00.000Z",
      measurements: {
        pressure: 1012.8,
      },
    };

    const formatted = Telemetry.formatIncomingPayload(incoming);
    assert.strictEqual(formatted.metadata.deviceId, "device-099");
    assert.strictEqual(formatted.metadata.sensorId, "pressure-001");
    assert.strictEqual(formatted.timestamp.toISOString(), "2026-11-21T12:30:00.000Z");
    assert.strictEqual(formatted.measurements.get("pressure"), 1012.8);
  });

  test("indexes are configured for sensor and device time-range lookups", () => {
    const indexes = Telemetry.schema.indexes();
    const indexKeys = indexes.map((idx) => Object.keys(idx[0]).join(","));

    assert.ok(
      indexKeys.some((k) => k === "metadata.sensorId,timestamp"),
      "Should have compound index on metadata.sensorId and timestamp"
    );
    assert.ok(
      indexKeys.some((k) => k === "metadata.deviceId,timestamp"),
      "Should have compound index on metadata.deviceId and timestamp"
    );
    assert.ok(
      indexKeys.some((k) => k === "metadata.deviceId,metadata.sensorId,timestamp"),
      "Should have compound index on deviceId, sensorId and timestamp"
    );
  });
});
