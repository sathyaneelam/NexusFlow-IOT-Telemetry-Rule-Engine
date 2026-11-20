const { test, describe, before, after } = require("node:test");
const assert = require("node:assert");
const connectDB = require("../src/config/database");
const { disconnectDB, getConnectionState, isDBConnected, getDefaultOptions } = require("../src/config/database");

describe("MongoDB Database Connection Module", () => {
  before(() => {
    process.env.NODE_ENV = "test";
  });

  test("connectDB module exports a callable function for backward compatibility", () => {
    assert.strictEqual(typeof connectDB, "function");
    assert.strictEqual(typeof connectDB.connectDB, "function");
    assert.strictEqual(typeof connectDB.disconnectDB, "function");
    assert.strictEqual(typeof connectDB.getConnectionState, "function");
    assert.strictEqual(typeof connectDB.isDBConnected, "function");
  });

  test("getDefaultOptions returns connection pool and timeout defaults", () => {
    const options = getDefaultOptions();
    assert.strictEqual(options.maxPoolSize, 50);
    assert.strictEqual(options.minPoolSize, 10);
    assert.strictEqual(options.serverSelectionTimeoutMS, 5000);
    assert.strictEqual(options.socketTimeoutMS, 45000);
  });

  test("getConnectionState reports 'disconnected' initially", () => {
    const state = getConnectionState();
    assert.strictEqual(typeof state, "string");
    assert.strictEqual(state, "disconnected");
  });

  test("isDBConnected returns false when disconnected", () => {
    assert.strictEqual(isDBConnected(), false);
  });

  test("disconnectDB completes gracefully when already disconnected", async () => {
    await assert.doesNotReject(async () => {
      await disconnectDB();
    });
  });

  test("connectDB handles connection failure with centralized error handling in test mode", async () => {
    // Attempt connecting to an unreachable port with short timeout to verify error handling
    await assert.rejects(
      async () => {
        await connectDB("mongodb://127.0.0.1:27099/nexusflow_test", {
          serverSelectionTimeoutMS: 500,
        });
      },
      (err) => {
        assert.ok(err instanceof Error);
        return true;
      }
    );
  });
});

