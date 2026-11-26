const { test, describe, before, after } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const app = require("../src/app");
const Telemetry = require("../src/models/Telemetry");
const { chunkArray, startTimer } = require("../src/utils/batchProcessor");
const { createBulkTelemetry } = require("../src/services/telemetryService");

describe("Bulk Write Optimization & Multi-Sensor Ingestion", () => {
  let server;
  let baseUrl;
  let originalInsertMany;

  before((_, done) => {
    originalInsertMany = Telemetry.insertMany;

    // Stub insertMany for batch simulation
    Telemetry.insertMany = async function (docs) {
      return docs.map((d) => {
        const doc = new Telemetry(d);
        doc._id = new mongoose.Types.ObjectId();
        return doc;
      });
    };

    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      done();
    });
  });

  after((_, done) => {
    Telemetry.insertMany = originalInsertMany;
    server.close(done);
  });

  test("chunkArray utility splits large arrays into expected sub-batches", () => {
    const list = Array.from({ length: 250 }, (_, i) => ({ id: i }));
    const chunks = chunkArray(list, 100);

    assert.strictEqual(chunks.length, 3);
    assert.strictEqual(chunks[0].length, 100);
    assert.strictEqual(chunks[1].length, 100);
    assert.strictEqual(chunks[2].length, 50);
  });

  test("chunkArray handles edge cases: empty array and invalid inputs", () => {
    assert.deepStrictEqual(chunkArray([]), []);
    assert.deepStrictEqual(chunkArray(null), []);
  });

  test("startTimer calculates execution duration in milliseconds", async () => {
    const timer = startTimer();
    await new Promise((resolve) => setTimeout(resolve, 15));
    const elapsed = timer();
    assert.ok(elapsed >= 10, `Expected elapsed >= 10ms, got ${elapsed}`);
  });

  test("createBulkTelemetry handles multi-device and multi-sensor batches", async () => {
    const multiSensorPayload = [
      {
        deviceId: "gateway-alpha",
        sensorId: "temp-north",
        timestamp: "2026-11-26T12:00:00.000Z",
        measurements: { temperature: 22.4 },
      },
      {
        deviceId: "gateway-alpha",
        sensorId: "humidity-north",
        timestamp: "2026-11-26T12:00:00.000Z",
        measurements: { humidity: 55.0 },
      },
      {
        deviceId: "gateway-beta",
        sensorId: "pressure-chamber",
        timestamp: "2026-11-26T12:00:00.000Z",
        measurements: { pressure: 1014.2 },
      },
      {
        deviceId: "gateway-gamma",
        sensorId: "vibration-turbine",
        timestamp: "2026-11-26T12:00:00.000Z",
        measurements: { vibration: 0.04, frequency: 60.1 },
      },
    ];

    const result = await createBulkTelemetry(multiSensorPayload, { chunkSize: 2 });

    assert.strictEqual(result.count, 4);
    assert.ok(result.summary, "Result must contain summary");
    assert.strictEqual(result.summary.total, 4);
    assert.strictEqual(result.summary.inserted, 4);
    assert.strictEqual(result.summary.failed, 0);
    assert.ok(typeof result.summary.durationMs === "number");
    assert.ok(result.summary.durationMs >= 0);
    assert.strictEqual(result.data.length, 4);
  });

  test("createBulkTelemetry handles partial write failures gracefully", async () => {
    const tempInsertMany = Telemetry.insertMany;
    Telemetry.insertMany = async function (docs) {
      const err = new Error("BulkWriteError");
      err.insertedDocs = [docs[0]];
      throw err;
    };

    try {
      const batch = [
        { deviceId: "dev-1", sensorId: "s-1", measurements: { v: 1 } },
        { deviceId: "dev-2", sensorId: "s-2", measurements: { v: 2 } },
      ];

      const res = await createBulkTelemetry(batch, { chunkSize: 2 });
      assert.strictEqual(res.summary.total, 2);
      assert.strictEqual(res.summary.inserted, 1);
      assert.strictEqual(res.summary.failed, 1);
    } finally {
      Telemetry.insertMany = tempInsertMany;
    }
  });

  test("POST /api/telemetry/bulk returns performance summary in HTTP response", async () => {
    const payload = {
      readings: [
        {
          deviceId: "device-perf-1",
          sensorId: "sensor-perf-1",
          measurements: { temperature: 28.0 },
        },
        {
          deviceId: "device-perf-2",
          sensorId: "sensor-perf-2",
          measurements: { temperature: 29.5 },
        },
      ],
    };

    const res = await fetch(`${baseUrl}/api/telemetry/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();

    assert.strictEqual(body.success, true);
    assert.strictEqual(body.count, 2);
    assert.ok(body.summary, "Response body must contain summary");
    assert.strictEqual(body.summary.total, 2);
    assert.strictEqual(body.summary.inserted, 2);
    assert.strictEqual(body.summary.failed, 0);
    assert.ok(typeof body.summary.durationMs === "number");
  });
});
