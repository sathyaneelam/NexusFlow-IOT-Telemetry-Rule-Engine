const { test, describe, before, after } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const app = require("../src/app");
const Telemetry = require("../src/models/Telemetry");

describe("Telemetry Ingestion API - POST /api/telemetry", () => {
  let server;
  let port;
  let baseUrl;
  let originalSave;

  before((_, done) => {
    // Stub Telemetry.prototype.save for unit/integration testing without requiring a live remote DB
    originalSave = Telemetry.prototype.save;
    Telemetry.prototype.save = async function () {
      if (!this._id) {
        this._id = new mongoose.Types.ObjectId();
      }
      return this;
    };

    server = app.listen(0, () => {
      port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      done();
    });
  });

  after((_, done) => {
    Telemetry.prototype.save = originalSave;
    server.close(done);
  });

  test("successfully ingests a valid sensor payload with 201 Created", async () => {
    const payload = {
      deviceId: "device-001",
      sensorId: "temperature-001",
      timestamp: "2026-11-22T12:00:00.000Z",
      measurements: {
        temperature: 32.5,
        humidity: 65.2,
        pressure: 1012.4,
      },
    };

    const res = await fetch(`${baseUrl}/api/telemetry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.message, "Telemetry reading ingested successfully");
    assert.ok(body.data.id, "Should return generated id");
    assert.strictEqual(body.data.deviceId, "device-001");
    assert.strictEqual(body.data.sensorId, "temperature-001");
    assert.strictEqual(body.data.timestamp, "2026-11-22T12:00:00.000Z");
    assert.strictEqual(body.data.measurements.temperature, 32.5);
    assert.strictEqual(body.data.measurements.humidity, 65.2);
    assert.strictEqual(body.data.measurements.pressure, 1012.4);
  });

  test("successfully ingests reading with omitted timestamp defaulting to current time", async () => {
    const payload = {
      deviceId: "device-002",
      sensorId: "humidity-002",
      measurements: {
        humidity: 48.9,
      },
    };

    const res = await fetch(`${baseUrl}/api/telemetry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.timestamp, "Should generate current timestamp");
    assert.strictEqual(body.data.deviceId, "device-002");
  });

  test("rejects request when deviceId is missing", async () => {
    const payload = {
      sensorId: "temperature-001",
      measurements: { temperature: 25.0 },
    };

    const res = await fetch(`${baseUrl}/api/telemetry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error, "ValidationError");
    assert.ok(body.message.includes("deviceId"));
  });

  test("rejects request when sensorId is missing", async () => {
    const payload = {
      deviceId: "device-001",
      measurements: { temperature: 25.0 },
    };

    const res = await fetch(`${baseUrl}/api/telemetry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error, "ValidationError");
    assert.ok(body.message.includes("sensorId"));
  });

  test("rejects request when measurements object is missing or empty", async () => {
    const payload = {
      deviceId: "device-001",
      sensorId: "temperature-001",
      measurements: {},
    };

    const res = await fetch(`${baseUrl}/api/telemetry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error, "ValidationError");
    assert.ok(body.message.includes("measurements"));
  });

  test("rejects request when measurement values are non-numeric", async () => {
    const payload = {
      deviceId: "device-001",
      sensorId: "temperature-001",
      measurements: {
        temperature: "hot",
      },
    };

    const res = await fetch(`${baseUrl}/api/telemetry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error, "ValidationError");
    assert.ok(body.message.includes("valid finite number"));
  });

  test("rejects request with invalid timestamp string", async () => {
    const payload = {
      deviceId: "device-001",
      sensorId: "temperature-001",
      timestamp: "invalid-timestamp-string",
      measurements: {
        temperature: 28.0,
      },
    };

    const res = await fetch(`${baseUrl}/api/telemetry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error, "ValidationError");
    assert.ok(body.message.includes("timestamp"));
  });

  test("rejects completely empty request payload", async () => {
    const res = await fetch(`${baseUrl}/api/telemetry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error, "ValidationError");
  });
});
