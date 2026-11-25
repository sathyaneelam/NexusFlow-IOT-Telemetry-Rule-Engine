const { test, describe, before, after } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const app = require("../src/app");
const Telemetry = require("../src/models/Telemetry");

describe("Latest Sensor Reading & Historical Telemetry APIs", () => {
  let server;
  let baseUrl;
  let originalFind;
  let originalFindOne;

  const mockHistoryData = [
    {
      _id: new mongoose.Types.ObjectId(),
      timestamp: new Date("2026-11-25T08:00:00.000Z"),
      metadata: { deviceId: "device-001", sensorId: "temp-100" },
      measurements: { temperature: 21.0 },
    },
    {
      _id: new mongoose.Types.ObjectId(),
      timestamp: new Date("2026-11-25T09:00:00.000Z"),
      metadata: { deviceId: "device-001", sensorId: "temp-100" },
      measurements: { temperature: 23.5 },
    },
    {
      _id: new mongoose.Types.ObjectId(),
      timestamp: new Date("2026-11-25T10:00:00.000Z"),
      metadata: { deviceId: "device-001", sensorId: "temp-100" },
      measurements: { temperature: 26.0 },
    },
  ];

  before((_, done) => {
    originalFind = Telemetry.find;
    originalFindOne = Telemetry.findOne;

    // Stub findOne
    Telemetry.findOne = function (query) {
      let filtered = [...mockHistoryData];
      if (query && query["metadata.sensorId"]) {
        filtered = filtered.filter((d) => d.metadata.sensorId === query["metadata.sensorId"]);
      }
      if (query && query["metadata.deviceId"]) {
        filtered = filtered.filter((d) => d.metadata.deviceId === query["metadata.deviceId"]);
      }

      // Latest first
      filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      const chain = {
        sort: () => chain,
        lean: () => Promise.resolve(filtered[0] || null),
        then: (resolve) => Promise.resolve(filtered[0] || null).then(resolve),
      };
      return chain;
    };

    // Stub find
    Telemetry.find = function (query) {
      let filtered = [...mockHistoryData];

      if (query && query["metadata.sensorId"]) {
        filtered = filtered.filter((d) => d.metadata.sensorId === query["metadata.sensorId"]);
      }
      if (query && query["metadata.deviceId"]) {
        filtered = filtered.filter((d) => d.metadata.deviceId === query["metadata.deviceId"]);
      }
      if (query && query.timestamp) {
        if (query.timestamp.$gte) {
          filtered = filtered.filter((d) => d.timestamp >= query.timestamp.$gte);
        }
        if (query.timestamp.$lte) {
          filtered = filtered.filter((d) => d.timestamp <= query.timestamp.$lte);
        }
      }

      const chain = {
        sort: (sortObj) => {
          const key = Object.keys(sortObj)[0];
          const dir = sortObj[key];
          filtered.sort((a, b) => (dir === 1 ? a[key] - b[key] : b[key] - a[key]));
          return chain;
        },
        skip: () => chain,
        limit: (l) => {
          filtered = filtered.slice(0, l);
          return chain;
        },
        lean: () => Promise.resolve(filtered),
        then: (resolve) => Promise.resolve(filtered).then(resolve),
      };
      return chain;
    };

    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      done();
    });
  });

  after((_, done) => {
    Telemetry.find = originalFind;
    Telemetry.findOne = originalFindOne;
    server.close(done);
  });

  // --- Latest Sensor Reading Tests ---

  test("GET /api/telemetry/:sensorId/latest returns 200 and the newest reading", async () => {
    const res = await fetch(`${baseUrl}/api/telemetry/temp-100/latest`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();

    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.sensorId, "temp-100");
    assert.strictEqual(body.data.measurements.temperature, 26.0);
    assert.strictEqual(body.data.timestamp, "2026-11-25T10:00:00.000Z");
  });

  test("GET /api/telemetry/:sensorId/latest returns 404 when sensor has no records", async () => {
    const res = await fetch(`${baseUrl}/api/telemetry/non-existent-sensor/latest`);
    assert.strictEqual(res.status, 404);
    const body = await res.json();

    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error, "NotFoundError");
    assert.ok(body.message.includes("non-existent-sensor"));
  });

  // --- Historical Telemetry Tests ---

  test("GET /api/telemetry/:sensorId/history returns chronological readings (sort=asc default)", async () => {
    const res = await fetch(`${baseUrl}/api/telemetry/temp-100/history`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();

    assert.strictEqual(body.success, true);
    assert.strictEqual(body.sensorId, "temp-100");
    assert.strictEqual(body.query.sort, "asc");
    assert.strictEqual(body.data.length, 3);
    assert.strictEqual(body.data[0].measurements.temperature, 21.0);
    assert.strictEqual(body.data[2].measurements.temperature, 26.0);
  });

  test("GET /api/telemetry/:sensorId/history filters by startDate and endDate", async () => {
    const start = "2026-11-25T08:30:00.000Z";
    const end = "2026-11-25T09:30:00.000Z";
    const res = await fetch(`${baseUrl}/api/telemetry/temp-100/history?startDate=${start}&endDate=${end}`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();

    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.length, 1);
    assert.strictEqual(body.data[0].measurements.temperature, 23.5);
  });

  test("GET /api/telemetry/:sensorId/history respects limit parameter", async () => {
    const res = await fetch(`${baseUrl}/api/telemetry/temp-100/history?limit=2`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();

    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.length, 2);
  });
});
