/**
 * DEMO MODE — deterministic planner, real tools.
 *
 * Used only when GEMINI_API_KEY is absent. It selects free tools by explicit
 * keyword rules, executes them for real, and labels the run clearly. It never
 * fakes a model call, a payment, a transaction hash or a source.
 */
import { classifyIntent } from "./intent";
import { createRecorder } from "./recorder";
import { tools } from "./tools";
import type { RunResult, ToolStep } from "./types";

export const DEMO_NOTE =
  "Demo mode: no GEMINI_API_KEY configured. A deterministic planner selected and ran real free tools. No model call was made and no payment was attempted.";

type Choice =
  | { kind: "calc"; expression: string }
  | { kind: "units"; value: number; from: string; to: string }
  | { kind: "json"; json: string }
  | { kind: "summary"; text: string }
  | { kind: "plan"; goal: string; steps: string[] }
  | { kind: "url"; url: string }
  | { kind: "search"; query: string };

function choose(mission: string): Choice | null {
  const text = mission.trim();

  const url = text.match(/https?:\/\/[^\s<>"')]+/i)?.[0];
  if (url && /url|safe|link|domain|scheme/i.test(text)) return { kind: "url", url };

  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  if (jsonStart >= 0 && jsonEnd > jsonStart) return { kind: "json", json: text.slice(jsonStart, jsonEnd + 1) };

  const conv = text.match(/(-?\d+(?:\.\d+)?)\s*([a-z°/]{1,12}(?:\/[a-z]{1,6})?)\s+(?:to|into|in)\s+([a-z°/]{1,14}(?:\/[a-z]{1,6})?)/i);
  if (conv && /convert|how many|in (km|mi|kg|lb|f|c|k|m|ft|cm|mm|gb|mb|kb|tb)\b/i.test(text)) {
    return { kind: "units", value: Number(conv[1]), from: conv[2], to: conv[3] };
  }

  const expr = text.match(/(?:calculate|compute|what\s+is|evaluate)\s+([0-9().+\-*/^%\s]+)/i);
  if (expr && /\d/.test(expr[1]) && /[+\-*/^%]/.test(expr[1])) {
    return { kind: "calc", expression: expr[1].trim() };
  }

  if (/summar/i.test(text)) {
    const afterColon = text.includes(":") ? text.slice(text.indexOf(":") + 1).trim() : text;
    return { kind: "summary", text: afterColon };
  }

  if (/plan|checklist/i.test(text)) {
    const afterColon = text.includes(":") ? text.slice(text.indexOf(":") + 1).trim() : "";
    const raw = afterColon || text;
    const steps = raw
      .split(/\s*(?:;|,|→|->|\n|\band then\b|\band\b)\s*/i)
      .map((s) => s.replace(/^(create|make|build|draft)\s+(a\s+)?(plan|checklist)(\s+for)?\s*/i, "").trim())
      .filter((s) => s.length > 3);
    if (steps.length >= 2) return { kind: "plan", goal: text.slice(0, 240), steps: steps.slice(0, 12) };
  }

  return { kind: "search", query: text.replace(/^(research|search|look up|find)\s*:?\s*/i, "") || text };
}

export async function runDemoMission(mission: string, baseUrl: string): Promise<RunResult> {
  const intent = classifyIntent(mission);
  const rec = createRecorder({ mode: "demo", mission, intent });
  const choice = choose(mission);
  const answerParts: string[] = [];

  rec.setPlan("execute", "running", "Demo planner selected a free tool.");

  if (intent.paidAllowed.length > 0) {
    rec.setPlan(
      "approval",
      "blocked",
      "Demo mode cannot settle paid work. Add GEMINI_API_KEY and a funded testnet wallet. No charge was attempted."
    );
    rec.event("budget", "Paid capability requested but demo mode cannot execute or settle payments.");
  } else {
    rec.setPlan("approval", "skipped", "No paid capability was requested.");
  }

  async function run(name: string, args: Record<string, unknown>): Promise<unknown> {
    const tool = tools.find((t) => t.name === name);
    if (!tool) throw new Error(`Unknown tool ${name}`);
    const pending = rec.beginStep(name, args, false);
    try {
      const result = await tool.run(args, { baseUrl });
      rec.endStep(pending, name, args, result, { paid: false });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      rec.endStep(pending, name, args, { error: message }, { error: true, paid: false });
      throw err;
    }
  }

  let failed = false;
  try {
    if (choice?.kind === "calc") {
      const out = (await run("calculate_expression", { expression: choice.expression })) as { expression: string; value: number };
      answerParts.push(`**Calculation** — \`${out.expression}\` = **${out.value}**.`);
    } else if (choice?.kind === "units") {
      const out = (await run("convert_units", { value: choice.value, from: choice.from, to: choice.to })) as {
        value: number;
        from: string;
        to: string;
        result: number;
        dimension: string;
      };
      answerParts.push(`**Conversion** — ${out.value} ${out.from} = **${out.result} ${out.to}** (${out.dimension}).`);
    } else if (choice?.kind === "json") {
      const out = (await run("format_json", { json: choice.json })) as { valid: boolean; bytes: number; topLevelType: string; keys: number };
      answerParts.push(
        `**JSON is valid** — top-level ${out.topLevelType}, ${out.keys} key(s), ${out.bytes} formatted bytes. The formatted output is in the tool step.`
      );
    } else if (choice?.kind === "summary") {
      const out = (await run("summarize_text", { text: choice.text, max_sentences: 4 })) as {
        summary: string;
        sourceSentences: number;
        pickedSentences: string[];
      };
      answerParts.push(
        `**Extractive summary** (${out.pickedSentences.length} of ${out.sourceSentences} sentences, deterministic — not a generative rewrite):\n\n${out.summary}`
      );
    } else if (choice?.kind === "plan") {
      const out = (await run("create_action_plan", { goal: choice.goal, steps: choice.steps })) as {
        items: { title: string; status: string }[];
      };
      answerParts.push(
        `**Checklist generated — nothing executed.**\n\n${out.items.map((i, n) => `${n + 1}. ${i.title} — ${i.status}`).join("\n")}`
      );
    } else if (choice?.kind === "url") {
      const out = (await run("check_url_safety", { url: choice.url })) as {
        safe: boolean;
        host: string | null;
        warnings: string[];
        note: string;
      };
      answerParts.push(
        `**URL syntax check** — ${out.safe ? "no obvious syntax/host risk" : "blocked"}: \`${out.host ?? "unknown host"}\`. ${out.warnings.join(" ") || ""} ${out.note}`
      );
    } else if (choice?.kind === "search") {
      const out = (await run("web_search", { query: choice.query })) as {
        results: { title: string; url: string; source: string }[];
      };
      const lines = out.results.map((r) => `- [${r.title}](${r.url}) — ${r.source}`);
      answerParts.push(`**Free web search** for “${choice.query}” returned these real sources:\n\n${lines.join("\n")}`);
      answerParts.push("For full-page reading and citations, enable live mode and approve the paid `research_web` tool.");
    }
  } catch (err) {
    failed = true;
    answerParts.push(`The selected free tool failed: ${err instanceof Error ? err.message : String(err)}. No paid tool was attempted.`);
  }

  if (intent.paidAllowed.length > 0) {
    answerParts.push(
      `This request also needs paid capability (\`${intent.paidAllowed.join("`, `")}\`). Demo mode does not show a fake approval or settle a payment — configure \`GEMINI_API_KEY\` plus the testnet wallet to use it.`
    );
  }

  if (!answerParts.length) {
    answerParts.push("The demo planner could not map this mission to a free tool. Try a calculation, unit conversion, JSON formatting, summary, checklist, URL check or a search.");
  }

  const answer = `${answerParts.join("\n\n")}\n\n---\n_${DEMO_NOTE}_`;

  rec.setPlan("execute", failed ? "blocked" : "complete", failed ? "The selected tool failed." : "Real free tool execution finished.");
  rec.setPlan("answer", "complete", "Answer composed from tool output.");
  rec.event("final", "Answer delivered (demo planner).");

  return {
    status: "completed",
    runId: rec.runId,
    mode: "demo",
    mission,
    intent: rec.intent,
    answer,
    steps: rec.steps as ToolStep[],
    events: rec.events,
    plan: rec.plan,
    note: DEMO_NOTE,
    startedAt: rec.startedAt,
    finishedAt: new Date().toISOString(),
  };
}
