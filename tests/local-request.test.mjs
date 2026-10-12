import assert from "node:assert/strict";
import { setTimeout } from "node:timers/promises";
import {
  localRequestSignal,
  localTimeoutError,
  LOCAL_REQUEST_TIMEOUT_MS,
} from "../src/lib/local-request.mjs";
import { isDefiniteLocalRejection } from "../src/lib/local-summary-contract.mjs";
assert.equal(LOCAL_REQUEST_TIMEOUT_MS, 12000);
const controller = new AbortController(),
  signal = localRequestSignal(controller.signal, 20);
assert.equal(signal.aborted, false);
await setTimeout(35);
assert.equal(signal.aborted, true);
assert.equal(signal.reason.name, "TimeoutError");
const e = localTimeoutError(signal);
assert.equal(e.code, "request-timeout");
assert.equal(e.status, undefined);
assert.equal(isDefiniteLocalRejection(e), false);
const caller = new AbortController(),
  combined = localRequestSignal(caller.signal);
caller.abort();
assert.equal(combined.aborted, true);
assert.equal(localTimeoutError(combined), null);
assert.equal(localTimeoutError(localRequestSignal()), null);
console.log(
  "Bounded local deadline, caller cancellation, unknown-write outcome retains original key PASS",
);
