import test from "node:test";
import assert from "node:assert/strict";
import { __clearApprovalsForTests, consumeApproval, createApproval } from "../agent/approvals.ts";
import { ApprovalError } from "../agent/types.ts";

function seed() {
  return createApproval({
    mode: "live",
    runId: "run-test",
    startedAt: new Date().toISOString(),
    mission: "test",
    intent: { label: "weather", note: "test", paidAllowed: ["get_weather"] },
    plan: [],
    steps: [],
    events: [],
    contents: [{ role: "model", parts: [{ text: "calling" }] }],
    calls: [{ id: "c1", tool: "get_weather", args: { city: "X" }, cost: "0.01 USDC", priceUsdc: 0.01 }],
    freeResponses: {},
    spentUsdc: 0,
    budgetUsdc: 0.25,
    paidApprovals: 1,
    network: "Base Sepolia · TESTNET",
  });
}

test("approval is server-issued, opaque and single-use", () => {
  __clearApprovalsForTests();
  const rec = seed();
  assert.match(rec.id, /^[0-9a-f-]{36}$/);
  const consumed = consumeApproval(rec.id);
  assert.equal(consumed.calls[0].tool, "get_weather");
  assert.throws(() => consumeApproval(rec.id), (err) => err instanceof ApprovalError && err.code === "unknown");
});

test("approval rejects guessed ids and malformed ids", () => {
  __clearApprovalsForTests();
  assert.throws(() => consumeApproval("00000000-0000-4000-8000-000000000000"), ApprovalError);
  assert.throws(() => consumeApproval("nope"), (err) => err instanceof ApprovalError && err.code === "invalid");
  assert.throws(() => consumeApproval(undefined as unknown as string), ApprovalError);
});

test("expired approvals cannot be consumed", () => {
  __clearApprovalsForTests();
  const rec = seed();
  rec.expiresAt = Date.now() - 1;
  assert.throws(
    () => consumeApproval(rec.id),
    (err) => err instanceof ApprovalError && (err.code === "expired" || err.code === "unknown")
  );
});
