import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateExpression,
  checkUrlSafety,
  compareSources,
  convertUnits,
  createActionPlan,
  formatJson,
  summarizeText,
} from "../lib/toolkit.ts";

test("calculate_expression: arithmetic and precedence", () => {
  assert.equal(calculateExpression("2 + 3 * 4").value, 14);
  assert.equal(calculateExpression("(2 + 3) * 4").value, 20);
  assert.equal(calculateExpression("2 ^ 3 ^ 2").value, 512);
  assert.equal(calculateExpression("-2 ^ 2").value, -4);
  assert.equal(calculateExpression("10 % 4").value, 2);
  assert.ok(Math.abs(calculateExpression("0.1 + 0.2").value - 0.3) < 1e-12);
});

test("calculate_expression: rejects unsafe or malformed input", () => {
  assert.throws(() => calculateExpression("alert(1)"), /Unsupported character/);
  assert.throws(() => calculateExpression("process.exit(1)"), /Unsupported character/);
  assert.throws(() => calculateExpression("1 +"), /ended early/);
  assert.throws(() => calculateExpression("1 / 0"), /Division by zero/);
  assert.throws(() => calculateExpression("2..3"), /decimal point/);
  assert.throws(() => calculateExpression("(1 + 2"), /Expected|ended early/);
  assert.throws(() => calculateExpression("1 2"), /trailing input/);
  assert.throws(() => calculateExpression(""), /empty/);
});

test("convert_units: length, mass, temperature", () => {
  assert.equal(convertUnits(1, "mi", "m").result, 1609.344);
  assert.equal(convertUnits(100, "c", "f").result, 212);
  assert.equal(convertUnits(0, "c", "k").result, 273.15);
  assert.equal(convertUnits(1, "kg", "g").result, 1000);
  assert.equal(convertUnits(1, "GB", "MB").result, 1024);
  assert.equal(convertUnits(60, "km/h", "m/s").result, 16.66666667);
});

test("convert_units: rejects incompatible dimensions and unknown units", () => {
  assert.throws(() => convertUnits(1, "m", "kg"), /Cannot convert length/);
  assert.throws(() => convertUnits(1, "furlong", "m"), /Unknown unit/);
  assert.throws(() => convertUnits(Number.NaN, "m", "cm"), /finite/);
});

test("format_json: formats valid JSON and reports invalid input", () => {
  const out = formatJson('{"b":1,"a":[true,null]}');
  assert.equal(out.valid, true);
  assert.equal(out.topLevelType, "object");
  assert.equal(out.keys, 2);
  assert.match(out.formatted, /\n  "b": 1/);
  assert.throws(() => formatJson('{"a":}'), /Invalid JSON/);
  assert.throws(() => formatJson(""), /empty/);
});

test("summarize_text: deterministic extractive summary", () => {
  const text =
    "Satellites orbit Earth at high speed. The ground station tracks each satellite pass carefully. " +
    "Weather delays can interrupt a satellite launch. Engineers review the ground station telemetry daily. " +
    "A satellite needs stable power before launch. The launch window depends on the weather forecast.";
  const a = summarizeText(text, 3);
  const b = summarizeText(text, 3);
  assert.deepEqual(a, b);
  assert.equal(a.method, "deterministic-extractive");
  assert.ok(a.pickedSentences.length <= 3);
  assert.ok(a.summaryChars < a.originalChars);
  assert.throws(() => summarizeText("   "), /Nothing to summarize/);
});

test("create_action_plan: validates and never executes", () => {
  const plan = createActionPlan("Ship a briefing", ["Gather sources", "Draft", "Review"]);
  assert.equal(plan.items.length, 3);
  assert.deepEqual(plan.items.map((i) => i.status), ["pending", "pending", "pending"]);
  assert.match(plan.note, /no step was executed/);
  assert.throws(() => createActionPlan("", ["step"]), /goal/);
  assert.throws(() => createActionPlan("goal", []), /between 1 and 12/);
  assert.throws(() => createActionPlan("goal", Array(13).fill("x")), /Too many/);
});

test("check_url_safety: syntax only, blocks private hosts", () => {
  assert.equal(checkUrlSafety("https://example.com/path").safe, true);
  assert.equal(checkUrlSafety("http://localhost:3000/admin").safe, false);
  assert.equal(checkUrlSafety("https://127.0.0.1/").safe, false);
  assert.equal(checkUrlSafety("file:///etc/passwd").safe, false);
  assert.equal(checkUrlSafety("https://user:pass@example.com").safe, false);
  const out = checkUrlSafety("not a url");
  assert.equal(out.safe, false);
  assert.match(out.note, /nothing was fetched/);
});

test("compare_sources: only uses supplied excerpts", () => {
  const out = compareSources("agent payments", [
    { title: "A", url: "https://a.example", excerpt: "Agent payments use signed authorization for settlement." },
    { title: "B", url: "https://b.example", excerpt: "Agent payments require signed authorization and budget limits." },
  ]);
  assert.equal(out.sourceCount, 2);
  assert.ok(out.commonTerms.includes("payments"));
  assert.ok(out.gaps.includes("agent") === false);
  assert.throws(() => compareSources("q", [{ excerpt: "only one" }]), /at least two/);
});
