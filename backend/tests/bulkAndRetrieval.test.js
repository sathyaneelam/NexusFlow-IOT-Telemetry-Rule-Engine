const { test, describe, before, after } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const app = require("../src/app");
const Telemetry = require("../src/models/Telemetry");

describe("Bulk Telemetry Ingestion & Retrieval APIs", () => {
  let server;
  let baseUrl;
  let originalInsertMany;
  let originalFind;
  let originalCountDocuments;

  const mockDbDocs = [
    {
      _id: new mongoose.Types.ObjectId(),
      timestamp: new Date("2026-11-23T10:00:00.000Z"),
      metadata: { deviceId: "device-001", sensorId: "temp-001" },
      measurements: { temperature: 24.5, humidity: 60.1 },
    },
    {
      _id: new mongoose.Types.ObjectId(),
      timestamp: new Date("2026-11-23T10:05:00.000Z"),
      metadata: { deviceId: "device-001", sensorId: "press-001" },
      measurements: { pressure: 1013.2 },
    },
    {
      _id: new mongoose.Types.ObjectId(),
      timestamp: new Date("2026-11-23T10:10:00.000Z"),
      metadata: { deviceId: "device-002", sensorId: "temp-002" },
      measurements: { temperature: 30.1 },
    },
  ];

  before((_, done) => {
    // Stub insertMany
    originalInsertMany = Telemetry.insertMany;
    Telemetry.insertMany = async function (docs) {
      return docs.map((d) => {
        const doc = new Telemetry(d);
        doc._id = new mongoose.Types.ObjectId();
        return doc;
      });
    };

    // Stub countDocuments
    originalCountDocuments = Telemetry.countDocuments;
    Telemetry.countDocuments = async function () {
      return mockDbDocs.length;
    };

    // Stub find with chainable sort, skip, limit, lean
    originalFind = Telemetry.find;
    Telemetry.find = function (query) {
      let filtered = [...mockDbDocs];
      if (query && query["metadata.sensorId"]) {
        filtered = filtered.filter((d) => d.metadata.sensorId === query["metadata.sensorId"]);
      }
      if (query && query["metadata.deviceId"]) {
        filtered = filtered.filter((d) => d.metadata.deviceId === query["metadata.deviceId"]);
      }

      const chain = {
        sort: () => chain,
        skip: () => chain,
        limit: (l) => {
          filtered = filtered.slice(0, l);
          return chain;
        },
        lean: () => Promise.resolve(filtered),
        then: (resolve, reject) => Promise.resolve(filtered).then(resolve, reject),
      };
      return chain;
    };

    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      done();
    });
  });

  after((_, done) => {
    Telemetry.insertMany = originalInsertMany;
    Telemetry.find = originalFind;
    Telemetry.countDocuments = originalCountDocuments;
    server.close(done);
  });

  // --- Bulk Ingestion Tests ---

  test("POST /api/telemetry/bulk ingests array inside { readings: [...] } with 201 Created", async () => {
    const payload = {
      readings: [
        {
          deviceId: "device-001",
          sensorId: "temp-001",
          timestamp: "2026-11-23T10:00:00.000Z",
          measurements: { temperature: 25.5 },
        },
        {
          deviceId: "device-001",
          sensorId: "humidity-001",
          measurements: { humidity: 55.2 },
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
    assert.strictEqual(body.data.length, 2);
    assert.strictEqual(body.data[0].deviceId, "device-001");
    assert.strictEqual(body.data[0].sensorId, "temp-001");
    assert.strictEqual(body.data[1].sensorId, "humidity-001");
  });

  test("POST /api/telemetry/bulk ingests direct array [...] with 201 Created", async () => {
    const payload = [
      {
        deviceId: "device-003",
        sensorId: "co2-001",
        measurements: { co2: 420 },
      },
    ];

    const res = await fetch(`${baseUrl}/api/telemetry/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.count, 1);
  });

  test("POST /api/telemetry/bulk rejects empty array", async () => {
    const res = await fetch(`${baseUrl}/api/telemetry/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ readings: [] }),
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.ok(body.message.includes("cannot be empty"));
  });

  test("POST /api/telemetry/bulk rejects non-array payload", async () => {
    const res = await fetch(`${baseUrl}/api/telemetry/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invalid: true }),
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
  });

  test("POST /api/telemetry/bulk identifies exact index of invalid reading in batch", async () => {
    const payload = {
      readings: [
        {
          deviceId: "device-001",
          sensorId: "valid-001",
          measurements: { temperature: 20 },
        },
        {
          deviceId: "device-001",
          // Missing sensorId
          measurements: { temperature: 22 },
        },
      ],
    };

    const res = await fetch(`${baseUrl}/api/telemetry/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.index, 1);
    assert.ok(body.message.includes("index [1]"));
  });

  // --- Telemetry Retrieval Tests ---

  test("GET /api/telemetry returns paginated telemetry readings", async () => {
    const res = await fetch(`${baseUrl}/api/telemetry?page=1&limit=10`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();

    assert.strictEqual(body.success, true);
    assert.ok(body.pagination, "Pagination object should be present");
    assert.strictEqual(body.pagination.page, 1);
    assert.strictEqual(body.pagination.limit, 10);
    assert.ok(Array.isArray(body.data));
    assert.strictEqual(body.data.length, 3);
  });

  test("GET /api/telemetry accepts deviceId filter", async () => {
    const res = await fetch(`${baseUrl}/api/telemetry?deviceId=device-002`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();

    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.length, 1);
    assert.strictEqual(body.data[0].deviceId, "device-002");
  });

  test("GET /api/telemetry/:sensorId returns readings for specific sensor", async () => {
    const res = await fetch(`${baseUrl}/api/telemetry/temp-001`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();

    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.length, 1);
    assert.strictEqual(body.data[0].sensorId, "temp-001");
  });
});
