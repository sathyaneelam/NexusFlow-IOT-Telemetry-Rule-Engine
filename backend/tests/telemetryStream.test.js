const { test, describe, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const telemetryStream = require("../src/services/telemetryStream");
const telemetryService = require("../src/services/telemetryService");
const Telemetry = require("../src/models/Telemetry");

describe("Day 9: RxJS Reactive Telemetry Stream Service", () => {
  beforeEach(() => {
    telemetryStream.resetStream();
  });

  afterEach(() => {
    telemetryStream.resetStream();
  });

  test("publishes single telemetry reading and notifies stream subscribers", (t, done) => {
    const rawReading = {
      deviceId: "device-alpha",
      sensorId: "temp-sensor-101",
      timestamp: "2026-11-27T12:00:00.000Z",
      measurements: {
        temperature: 28.5,
        humidity: 55.0,
      },
    };

    const subscription = telemetryStream.getTelemetryStream().subscribe({
      next: (event) => {
        assert.strictEqual(event.deviceId, "device-alpha");
        assert.strictEqual(event.sensorId, "temp-sensor-101");
        assert.strictEqual(event.timestamp, "2026-11-27T12:00:00.000Z");
        assert.strictEqual(event.measurements.temperature, 28.5);
        assert.strictEqual(event.measurements.humidity, 55.0);
        subscription.unsubscribe();
        done();
      },
      error: (err) => done(err),
    });

    telemetryStream.publishTelemetry(rawReading);
  });

  test("publishes bulk telemetry readings sequentially to subscribers", (t, done) => {
    const batch = [
      {
        deviceId: "device-01",
        sensorId: "temp-01",
        timestamp: "2026-11-27T12:00:01.000Z",
        measurements: { temperature: 21.0 },
      },
      {
        deviceId: "device-02",
        sensorId: "temp-02",
        timestamp: "2026-11-27T12:00:02.000Z",
        measurements: { temperature: 22.5 },
      },
      {
        deviceId: "device-03",
        sensorId: "temp-03",
        timestamp: "2026-11-27T12:00:03.000Z",
        measurements: { temperature: 23.8 },
      },
    ];

    const received = [];
    const subscription = telemetryStream.getTelemetryStream().subscribe({
      next: (event) => {
        received.push(event);
        if (received.length === 3) {
          assert.strictEqual(received[0].sensorId, "temp-01");
          assert.strictEqual(received[1].sensorId, "temp-02");
          assert.strictEqual(received[2].sensorId, "temp-03");
          subscription.unsubscribe();
          done();
        }
      },
      error: (err) => done(err),
    });

    const count = telemetryStream.publishBulkTelemetry(batch);
    assert.strictEqual(count, 3);
  });

  test("getSensorStream isolates events for a specific sensorId", (t, done) => {
    const targetSensor = "vibration-sensor-99";
    const events = [];

    const subscription = telemetryStream.getSensorStream(targetSensor).subscribe({
      next: (event) => {
        events.push(event);
        if (events.length === 1) {
          assert.strictEqual(event.sensorId, targetSensor);
          assert.strictEqual(event.deviceId, "edge-node-01");
          subscription.unsubscribe();
          done();
        }
      },
      error: (err) => done(err),
    });

    // Publish reading from other sensor (should be filtered out)
    telemetryStream.publishTelemetry({
      deviceId: "edge-node-02",
      sensorId: "pressure-sensor-01",
      measurements: { pressure: 1013 },
    });

    // Publish reading from target sensor (should be received)
    telemetryStream.publishTelemetry({
      deviceId: "edge-node-01",
      sensorId: targetSensor,
      measurements: { vibration: 0.04 },
    });
  });

  test("getDeviceStream isolates events for a specific deviceId", (t, done) => {
    const targetDevice = "gateway-hub-42";
    const events = [];

    const subscription = telemetryStream.getDeviceStream(targetDevice).subscribe({
      next: (event) => {
        events.push(event);
        if (events.length === 2) {
          assert.strictEqual(events[0].deviceId, targetDevice);
          assert.strictEqual(events[1].deviceId, targetDevice);
          subscription.unsubscribe();
          done();
        }
      },
      error: (err) => done(err),
    });

    telemetryStream.publishTelemetry({
      deviceId: "other-hub-01",
      sensorId: "sensor-a",
      measurements: { val: 1 },
    });

    telemetryStream.publishTelemetry({
      deviceId: targetDevice,
      sensorId: "sensor-b",
      measurements: { val: 2 },
    });

    telemetryStream.publishTelemetry({
      deviceId: targetDevice,
      sensorId: "sensor-c",
      measurements: { val: 3 },
    });
  });

  test("getMetricThresholdStream triggers breach alert when measurement exceeds threshold", (t, done) => {
    const thresholdSubscription = telemetryStream
      .getMetricThresholdStream("temperature", 50.0, ">")
      .subscribe({
        next: (alert) => {
          assert.strictEqual(alert.sensorId, "boiler-temp-01");
          assert.ok(alert.breach);
          assert.strictEqual(alert.breach.metric, "temperature");
          assert.strictEqual(alert.breach.value, 65.4);
          assert.strictEqual(alert.breach.threshold, 50.0);
          assert.strictEqual(alert.breach.operator, ">");
          assert.ok(alert.breach.breachedAt);
          thresholdSubscription.unsubscribe();
          done();
        },
        error: (err) => done(err),
      });

    // Reading below threshold - should not emit breach
    telemetryStream.publishTelemetry({
      deviceId: "boiler-controller",
      sensorId: "boiler-temp-01",
      measurements: { temperature: 42.1 },
    });

    // Reading above threshold - should emit breach
    telemetryStream.publishTelemetry({
      deviceId: "boiler-controller",
      sensorId: "boiler-temp-01",
      measurements: { temperature: 65.4 },
    });
  });

  test("tracks subscriber count and cleans up on resetStream", () => {
    assert.strictEqual(telemetryStream.getSubscriberCount(), 0);

    const sub1 = telemetryStream.getTelemetryStream().subscribe(() => {});
    const sub2 = telemetryStream.getTelemetryStream().subscribe(() => {});
    assert.strictEqual(telemetryStream.getSubscriberCount(), 2);

    sub1.unsubscribe();
    assert.strictEqual(telemetryStream.getSubscriberCount(), 1);

    telemetryStream.resetStream();
    assert.strictEqual(telemetryStream.getSubscriberCount(), 0);
    sub2.unsubscribe();
  });

  test("integrates with telemetryService to stream on createTelemetry and createBulkTelemetry", async () => {
    // Stub save and insertMany for telemetryService
    const originalSave = Telemetry.prototype.save;
    const originalInsertMany = Telemetry.insertMany;

    Telemetry.prototype.save = async function () {
      if (!this._id) this._id = new mongoose.Types.ObjectId();
      return this;
    };

    Telemetry.insertMany = async function (docs) {
      return docs.map((d) => ({
        _id: new mongoose.Types.ObjectId(),
        metadata: d.metadata,
        timestamp: d.timestamp,
        measurements: d.measurements,
        toJSON: function () {
          return {
            id: this._id.toString(),
            deviceId: this.metadata.deviceId,
            sensorId: this.metadata.sensorId,
            timestamp: this.timestamp.toISOString(),
            measurements: this.measurements,
          };
        },
      }));
    };

    try {
      const streamedEvents = [];
      const sub = telemetryStream.getTelemetryStream().subscribe((ev) => {
        streamedEvents.push(ev);
      });

      // 1. Test single ingestion service call publishes to stream
      await telemetryService.createTelemetry({
        deviceId: "service-dev-1",
        sensorId: "service-sens-1",
        timestamp: "2026-11-27T10:00:00.000Z",
        measurements: { humidity: 45 },
      });

      assert.strictEqual(streamedEvents.length, 1);
      assert.strictEqual(streamedEvents[0].deviceId, "service-dev-1");
      assert.strictEqual(streamedEvents[0].sensorId, "service-sens-1");

      // 2. Test bulk ingestion service call publishes to stream
      await telemetryService.createBulkTelemetry([
        {
          deviceId: "bulk-dev-1",
          sensorId: "bulk-sens-1",
          timestamp: "2026-11-27T10:01:00.000Z",
          measurements: { pressure: 1010 },
        },
        {
          deviceId: "bulk-dev-2",
          sensorId: "bulk-sens-2",
          timestamp: "2026-11-27T10:02:00.000Z",
          measurements: { pressure: 1015 },
        },
      ]);

      assert.strictEqual(streamedEvents.length, 3);
      assert.strictEqual(streamedEvents[1].deviceId, "bulk-dev-1");
      assert.strictEqual(streamedEvents[2].deviceId, "bulk-dev-2");

      sub.unsubscribe();
    } finally {
      Telemetry.prototype.save = originalSave;
      Telemetry.insertMany = originalInsertMany;
    }
  });
});
