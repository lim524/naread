import { test } from "node:test";
import assert from "node:assert/strict";
import { sameOrigin } from "../src/lib/request-origin";

test("Next bind address accepts the browser's actual host and port", () => {
  const request = (origin: string) => new Request("http://0.0.0.0:3000/api/analyze/individual", {
    headers: { host: "localhost:3000", origin },
  });
  assert.doesNotThrow(() => sameOrigin(request("http://localhost:3000")));
  for (const origin of ["http://evil.example", "http://localhost:3001", "https://localhost:3000", "null"]) {
    assert.throws(() => sameOrigin(request(origin)), /허용되지 않은 요청/);
  }
});

test("same URL origin and requests without Origin remain supported", () => {
  assert.doesNotThrow(() => sameOrigin(new Request("http://localhost:3000/api", {
    headers: { origin: "http://localhost:3000" },
  })));
  assert.doesNotThrow(() => sameOrigin(new Request("http://localhost:3000/api")));
});
