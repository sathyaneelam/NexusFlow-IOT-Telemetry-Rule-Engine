const { test, describe, before, after } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const app = require("../src/app");
const Telemetry = require("../src/models/Telemetry");
const { formatTelemetryDoc, getTelemetry } = require("../src/services/telemetryService");

describe("Database Query Optimization & Advanced Filtering", () => {
  let server;
  let baseUrl;
  let originalFind;
  let originalCountDocuments;

  const mockData = [
    {
      _id: new mongoose.Types.ObjectId(),
      timestamp: new Date("2026-11-24T10:00:00.000Z"),
      metadata: { deviceId: "device-001", sensorId: "temp-001" },
      measurements: { temperature: 22.0, humidity: 55.0 },
    },
    {
      _id: new mongoose.Types.ObjectId(),
      timestamp: new Date("2026-11-24T10:05:00.000Z"),
      metadata: { deviceId: "device-001", sensorId: "temp-001" },
      measurements: { temperature: 28.5, humidity: 62.0 },
    },
    {
      _id: new mongoose.Types.ObjectId(),
      timestamp: new Date("2026-11-24T10:10:00.000Z"),
      metadata: { deviceId: "device-002", sensorId: "temp-002" },
      measurements: { temperature: 35.0, humidity: 70.0 },
    },
  ];

  before((_, done) => {
    originalCountDocuments = Telemetry.countDocuments;
    originalFind = Telemetry.find;

    Telemetry.countDocuments = async function () {
      return mockData.length;
    };

    Telemetry.find = function (query) {
      let filtered = [...mockData];

      if (query && query["metadata.sensorId"]) {
        filtered = filtered.filter((d) => d.metadata.sensorId === query["metadata.sensorId"]);
      }
      if (query && query["metadata.deviceId"]) {
        filtered = filtered.filter((d) => d.metadata.deviceId === query["metadata.deviceId"]);
      }
      if (query && query["measurements.temperature"]) {
        const tFilter = query["measurements.temperature"];
        if (tFilter.$gte !== undefined) {
          filtered = filtered.filter((d) => d.measurements.temperature >= tFilter.$gte);
        }
        if (tFilter.$lte !== undefined) {
          filtered = filtered.filter((d) => d.measurements.temperature <= tFilter.$lte);
        }
      }

      const chain = {
        sort: (sortObj) => {
          const key = Object.keys(sortObj)[0];
          const dir = sortObj[key];
          filtered.sort((a, b) => {
            const valA = a[key] instanceof Date ? a[key].getTime() : a[key];
            const valB = b[key] instanceof Date ? b[key].getTime() : b[key];
            return dir === 1 ? valA - valB : valB - valA;
          });
          return chain;
        },
        skip: (s) => {
          filtered = filtered.slice(s);
          return chain;
        },
        limit: (l) => {
          filtered = filtered.slice(0, l);
          return chain;
        },
        lean: () => Promise.resolve(filtered),
      };

      return chain;
    };

    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      done();
    });
  });

  after((_, done) => {
    Telemetry.countDocuments = originalCountDocuments;
    Telemetry.find = originalFind;
    server.close(done);
  });

  test("formatTelemetryDoc formats raw .lean() objects without hydration overhead", () => {
    const raw = {
      _id: new mongoose.Types.ObjectId(),
      timestamp: new Date("2026-11-24T12:00:00.000Z"),
      metadata: { deviceId: "device-999", sensorId: "sensor-999" },
      measurements: { temperature: 25.0 },
    };

    const formatted = formatTelemetryDoc(raw);
    assert.strictEqual(formatted.id, raw._id.toString());
    assert.strictEqual(formatted.deviceId, "device-999");
    assert.strictEqual(formatted.sensorId, "sensor-999");
    assert.strictEqual(formatted.timestamp, "2026-11-24T12:00:00.000Z");
    assert.strictEqual(formatted.measurements.temperature, 25.0);
  });

  test("getTelemetry supports ascending sort order (sort=asc)", async () => {
    const res = await getTelemetry({ sort: "asc" });
    assert.strictEqual(res.data.length, 3);
    assert.strictEqual(res.data[0].measurements.temperature, 22.0);
    assert.strictEqual(res.data[2].measurements.temperature, 35.0);
  });

  test("getTelemetry supports metric threshold queries (minTemperature filter)", async () => {
    const res = await getTelemetry({ minTemperature: 28 });
    assert.strictEqual(res.data.length, 2);
    assert.ok(res.data.every((d) => d.measurements.temperature >= 28));
  });

  test("getTelemetry returns cursor pagination metadata (nextCursor and hasMore)", async () => {
    const res = await getTelemetry({ limit: 2 });
    assert.strictEqual(res.data.length, 2);
    assert.strictEqual(res.pagination.hasMore, true);
    assert.ok(res.pagination.nextCursor, "Should provide nextCursor");
  });

  test("GET /api/telemetry HTTP endpoint returns optimized response with threshold filters", async () => {
    const res = await fetch(`${baseUrl}/api/telemetry?minTemperature=30&sort=asc`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();

    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.length, 1);
    assert.strictEqual(body.data[0].measurements.temperature, 35.0);
  });

  test("GET /api/telemetry HTTP endpoint supports cursor-based query", async () => {
    const cursorTime = "2026-11-24T10:05:00.000Z";
    const res = await fetch(`${baseUrl}/api/telemetry?cursor=${cursorTime}&limit=2`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();

    assert.strictEqual(body.success, true);
    assert.ok(body.pagination);
    assert.strictEqual(body.pagination.page, null);
  });
});
