const { test, describe, before, after } = require("node:test");
const assert = require("node:assert");
const app = require("../src/app");

describe("NexusFlow App Health Endpoint", () => {
  let server;
  let port;

  before((_, done) => {
    server = app.listen(0, () => {
      port = server.address().port;
      done();
    });
  });

  after((_, done) => {
    server.close(done);
  });

  test("GET /health returns 200 and status OK", async () => {
    const res = await fetch(`http://127.0.0.1:${port}/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, "OK");
    assert.strictEqual(data.message, "NexusFlow backend is running successfully");
  });
});

