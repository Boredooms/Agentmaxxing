/**
 * VANTA — THE AGENT LOOP
 *
 *   mission → intent classification → Gemini → tool calls → evidence → answer
 *
 * Human-supervised money: when the model asks for a paid tool, the loop
 * stops. The client receives an opaque approval id and a display copy of the
 * calls — never the model state required to resume. Approving sends that id
 * back; the server consumes it once, re-validates the tool, price, intent and
 * budget, executes, then resumes the loop. Denial never executes the tool.
 */
import { FunctionCallingConfigMode, GoogleGenAI, type Content, type FunctionCall, type Part } from "@google/genai";
import { tools, type Tool } from "./tools";
import { classifyIntent, type Intent } from "./intent";
import { consumeApproval, createApproval } from "./approvals";
import { createRecorder, NETWORK_LABEL, parseUsdc, runBudgetUsdc, type Recorder } from "./recorder";
import type { Approval, ChatMessage, PendingCall, RunMode, RunResult } from "./types";
import { runDemoMission } from "./demo";

export const MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";
const MAX_STEPS = 6;
const TOOL_TIMEOUT_MS = 45_000;

const SYSTEM_PROMPT = [
  "You are VANTA, an observable autonomous work agent with real tools and a testnet wallet.",
  "Work in short, visible steps: pick the right tools, run them, and build the answer only from what the tools returned.",
  "A deterministic intent layer runs before you. Paid tools appear only when the user's request needs them; never pretend to have used a paid tool that was not offered, and never claim a payment happened.",
  "You have deterministic tools for arithmetic, unit conversion, JSON, extractive summaries, checklists and URL syntax checks — use them instead of guessing.",
  "For quick facts use web_search. When the user asks to research, compare sources or prepare a cited briefing and research_web is available in your toolbox, you MUST call research_web — it pauses for the user's approval — instead of substituting free snippets for a cited briefing. Cite only the titles and URLs it returns.",
  "Paid tool calls pause for a human approval card. If the user denies, accept it and answer without that data using free tools.",
  "Never invent sources, transaction hashes, latencies or tool results. If something is unavailable, say so plainly.",
  "Final answers: concise, structured, plain text or light Markdown, and explicitly evidence-based. Do not use LaTeX or $...$ math delimiters; write numbers and arithmetic inline. Add a Sources list when any source was returned. One emoji at most.",
].join(" ");

type CallCtx = { baseUrl: string };

const keyOf = (call: FunctionCall, index: number) => call.id ?? `${call.name ?? "call"}-${index}`;

function authorized(intent: Intent, tool: Tool): boolean {
  return !tool.cost || intent.paidAllowed.includes(tool.name);
}

function declarationsFor(intent: Intent) {
  return tools
    .filter((t) => authorized(intent, t))
    .map((t) => ({ name: t.name, description: t.description, parametersJsonSchema: t.parameters }));
}

/** Retry transient model overload. We only retry known transient failures;
 *  auth errors and bad requests surface immediately with a readable message. */
async function generateWithRetry(
  ai: GoogleGenAI,
  params: Parameters<GoogleGenAI["models"]["generateContent"]>[0]
) {
  let lastMessage = "The model request failed.";
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await ai.models.generateContent(params);
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      const transient = /(503|429|UNAVAILABLE|RESOURCE_EXHAUSTED|high demand|overloaded|temporarily)/i.test(raw);
      lastMessage = /(503|high demand|overloaded|temporarily)/i.test(raw)
        ? "The model is temporarily overloaded. Your run was not charged — try again in a few seconds."
        : /(429|RESOURCE_EXHAUSTED)/i.test(raw)
          ? "The model rate limit was reached. Wait a moment and try again."
          : raw.slice(0, 300);
      if (!transient || attempt === 2) throw new Error(lastMessage);
      await new Promise((resolve) => setTimeout(resolve, 700 * (attempt + 1) + 300));
    }
  }
  throw new Error(lastMessage);
}

async function executeTool(tool: Tool, args: unknown, ctx: CallCtx): Promise<unknown> {
  return Promise.race([
    tool.run(args ?? {}, ctx),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Tool timed out after ${TOOL_TIMEOUT_MS / 1000}s.`)), TOOL_TIMEOUT_MS)
    ),
  ]);
}

function historyToContents(history: ChatMessage[]): Content[] {
  const kept = history.slice(-8);
  return kept.map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: String(m.text ?? "").slice(-4000) }],
  }));
}

function finish(rec: Recorder, answer: string, mode: RunMode, note?: string): RunResult {
  rec.setPlan("execute", "complete", "Tool execution finished.");
  rec.setPlan("answer", "complete", "Answer composed from returned evidence.");
  rec.event("final", "Answer delivered.", {});
  return {
    status: "completed",
    runId: rec.runId,
    mode,
    mission: rec.mission,
    intent: rec.intent,
    answer,
    steps: rec.steps,
    events: rec.events,
    plan: rec.plan,
    note,
    startedAt: rec.startedAt,
    finishedAt: new Date().toISOString(),
  };
}

function pendingResult(rec: Recorder, approval: Approval, mode: RunMode, note?: string): RunResult {
  rec.setPlan("approval", "awaiting-approval", "Waiting for your decision. Nothing has been charged.");
  return {
    status: "pending",
    runId: rec.runId,
    mode,
    mission: rec.mission,
    intent: rec.intent,
    steps: rec.steps,
    events: rec.events,
    plan: rec.plan,
    pending: approval,
    note,
    startedAt: rec.startedAt,
    finishedAt: new Date().toISOString(),
  };
}

async function advance(
  contents: Content[],
  rec: Recorder,
  ctx: CallCtx,
  mode: RunMode,
  note?: string
): Promise<RunResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const intent: Intent = { ...rec.intent, paidAllowed: rec.intent.paidAllowed };
  const declarations = declarationsFor(intent);

  for (let step = 0; step < MAX_STEPS; step++) {
    // Paid capability was explicitly requested: make the FIRST action the
    // matching paid tool so the approval card can never be skipped by a model
    // that decides to answer from free snippets. The tool itself still does
    // not run — it pauses for the server-verified approval.
    const forced = declarations.filter((d) => intent.paidAllowed.includes(d.name)).map((d) => d.name);
    const toolConfig =
      step === 0 && forced.length > 0
        ? { functionCallingConfig: { mode: FunctionCallingConfigMode.ANY, allowedFunctionNames: forced } }
        : undefined;

    const response = await generateWithRetry(ai, {
      model: MODEL,
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools: declarations.length ? [{ functionDeclarations: declarations }] : undefined,
        ...(toolConfig ? { toolConfig } : {}),
      },
    });

    const calls = (response.functionCalls ?? []) as FunctionCall[];
    if (calls.length === 0) {
      const answer = (response.text ?? "").trim();
      if (!answer) throw new Error("The model returned no text and no tool calls.");
      return finish(rec, answer, mode, note);
    }

    const modelContent = response.candidates?.[0]?.content;
    if (!modelContent) throw new Error("Gemini returned tool calls without content.");
    contents.push(modelContent);
    rec.setPlan("execute", "running", "A tool call is being evaluated.");

    const indexed = calls.map((call, index) => ({ call, index }));
    const paid = indexed.filter(({ call }) => {
      const tool = tools.find((t) => t.name === call.name);
      return Boolean(tool?.cost) && authorized(intent, tool!);
    });
    const free = indexed.filter(({ call }) => {
      const tool = tools.find((t) => t.name === call.name);
      return Boolean(tool) && !tool!.cost;
    });
    const blocked = indexed.filter(({ call }) => {
      const tool = tools.find((t) => t.name === call.name);
      return !tool || (Boolean(tool.cost) && !authorized(intent, tool));
    });

    const freeResponses: Record<string, Part> = {};

    for (const { call, index } of [...free, ...blocked]) {
      const tool = tools.find((t) => t.name === call.name);
      const pending = rec.beginStep(call.name ?? "unknown", call.args, false);
      let result: unknown;
      let error = false;
      try {
        if (!tool) throw new Error(`No tool named ${call.name}.`);
        if (!authorized(intent, tool)) {
          throw new Error(
            `Tool ${call.name} is not available for this request — the user did not ask for that paid capability. Answer with the free tools you have.`
          );
        }
        result = await executeTool(tool, call.args, ctx);
      } catch (err) {
        result = { error: err instanceof Error ? err.message : String(err) };
        error = true;
      }
      rec.endStep(pending, call.name ?? "unknown", call.args, result, { error, paid: false });
      freeResponses[keyOf(call, index)] = {
        functionResponse: { id: call.id, name: call.name, response: { result } },
      };
    }

    if (paid.length > 0) {
      const pendingCalls: PendingCall[] = paid.map(({ call }) => {
        const tool = tools.find((t) => t.name === call.name)!;
        return {
          id: call.id ?? "",
          tool: tool.name,
          args: call.args,
          cost: tool.cost!,
          priceUsdc: parseUsdc(tool.cost),
        };
      });
      const total = Number(pendingCalls.reduce((sum, c) => sum + c.priceUsdc, 0).toFixed(6));
      const remaining = Math.max(0, rec.budgetUsdc - rec.spentUsdc);

      // One paid decision per run keeps the boundary legible: the model cannot
      // re-ask for another paid tool after the user already decided.
      const approvalReason =
        rec.paidApprovals >= 1
          ? "This run already used its single paid approval. Finish with the evidence you have; start a new mission for more paid work."
          : total > remaining
            ? `Per-run spending budget exceeded (${total} USDC > ${remaining.toFixed(2)} USDC remaining). Use free tools instead.`
            : null;

      if (approvalReason) {
        rec.event(rec.paidApprovals >= 1 ? "policy" : "budget", approvalReason);
        rec.setPlan(
          "approval",
          "blocked",
          rec.paidApprovals >= 1
            ? "One paid approval per run. No second charge can be requested."
            : `Run budget is ${rec.budgetUsdc.toFixed(2)} USDC; remaining ${remaining.toFixed(2)} USDC.`
        );
        for (const { call, index } of paid) {
          freeResponses[keyOf(call, index)] = {
            functionResponse: {
              id: call.id,
              name: call.name,
              response: { result: { denied: true, reason: approvalReason } },
            },
          };
        }
        contents.push({ role: "user", parts: calls.map((call, index) => freeResponses[keyOf(call, index)]) });
        continue;
      }

      rec.paidApprovals += 1;
      const approvalRecord = createApproval({
        mode,
        runId: rec.runId,
        startedAt: rec.startedAt,
        mission: rec.mission,
        intent: rec.intent,
        plan: rec.plan,
        steps: rec.steps,
        events: rec.events,
        contents,
        calls: pendingCalls,
        freeResponses,
        spentUsdc: rec.spentUsdc,
        budgetUsdc: rec.budgetUsdc,
        paidApprovals: rec.paidApprovals,
        network: NETWORK_LABEL,
      });

      rec.event(
        "approval_requested",
        `Approval required for ${pendingCalls.map((c) => c.tool).join(", ")} — ${total} USDC total on ${NETWORK_LABEL}.`,
        { amount: `${total} USDC` }
      );

      return pendingResult(
        rec,
        {
          id: approvalRecord.id,
          calls: pendingCalls,
          totalUsdc: total,
          budgetUsdc: rec.budgetUsdc,
          network: NETWORK_LABEL,
          reason:
            "This tool settles testnet USDC on-chain. VANTA never runs a paid tool without your explicit approval for this exact call.",
          expiresAt: new Date(approvalRecord.expiresAt).toISOString(),
        },
        mode,
        note
      );
    }

    contents.push({ role: "user", parts: calls.map((call, index) => freeResponses[keyOf(call, index)]) });
  }

  rec.setPlan("execute", "blocked", "Step limit reached before a final answer.");
  rec.event("error", "Step limit reached.");
  return finish(rec, "I hit the step limit before finishing. Try a narrower mission or ask a follow-up.", mode, note);
}

/** Start a run. Falls back to the deterministic demo planner without an API key. */
export async function runMission(input: {
  mission: string;
  history?: ChatMessage[];
  baseUrl: string;
  mode?: RunMode;
}): Promise<RunResult> {
  if (!process.env.GEMINI_API_KEY) {
    return runDemoMission(input.mission, input.baseUrl);
  }

  const mission = input.mission.trim().slice(0, 2000);
  if (!mission) throw new Error("Mission is empty.");
  const intent = classifyIntent(mission);
  const rec = createRecorder({ mode: "live", mission, intent, budgetUsdc: runBudgetUsdc() });
  const contents: Content[] = [
    ...historyToContents(input.history ?? []),
    { role: "user", parts: [{ text: mission }] },
  ];
  return advance(contents, rec, { baseUrl: input.baseUrl }, "live");
}

/** Resume a paused run. The approval id is the only authorization the client can supply. */
export async function resumeMission(input: {
  approvalId: string;
  decision: "approved" | "deny";
  baseUrl: string;
}): Promise<RunResult> {
  const record = consumeApproval(input.approvalId);
  const rec = createRecorder({
    quiet: true,
    mode: record.mode,
    mission: record.mission,
    intent: record.intent as Intent,
    plan: record.plan,
    steps: record.steps,
    events: record.events,
    spentUsdc: record.spentUsdc,
    budgetUsdc: record.budgetUsdc,
    paidApprovals: record.paidApprovals,
    runId: record.runId,
    startedAt: record.startedAt,
  });

  const last = record.contents[record.contents.length - 1];
  const calls = (last?.parts ?? []).flatMap((p) => (p.functionCall ? [p.functionCall] : []));
  if (calls.length === 0) throw new Error("Stored run has no pending tool calls.");

  const decisionApproved = input.decision === "approved";
  const total = record.calls.reduce((sum, c) => sum + c.priceUsdc, 0);
  rec.event(
    "approval_decision",
    decisionApproved
      ? `Spending approved for ${record.calls.map((c) => c.tool).join(", ")} (${total} USDC max).`
      : `Spending denied for ${record.calls.map((c) => c.tool).join(", ")}. No paid tool was run.`,
    { amount: `${total} USDC`, ok: decisionApproved }
  );

  const responses: Part[] = [];
  let blockedByValidation = false;

  for (let index = 0; index < calls.length; index++) {
    const call = calls[index];
    const key = keyOf(call, index);
    const paid = record.calls.find((c) => c.id === call.id && c.tool === call.name);

    if (!paid) {
      const stored = record.freeResponses[key];
      responses.push(
        stored ?? {
          functionResponse: { id: call.id, name: call.name, response: { result: { error: "Missing stored result for this call." } } },
        }
      );
      continue;
    }

    const tool = tools.find((t) => t.name === paid.tool);
    const intent = record.intent as Intent;
    const stillAuthorized = Boolean(tool?.cost) && authorized(intent, tool!);
    const priceMatches = tool?.cost ? parseUsdc(tool.cost) === paid.priceUsdc : false;
    const withinBudget = rec.spentUsdc + paid.priceUsdc <= rec.budgetUsdc + 1e-9;

    if (!decisionApproved) {
      const pending = rec.beginStep(paid.tool, call.args, true, paid.cost);
      const result = { denied: true, reason: "The user declined this payment. No charge was made." };
      rec.endStep(pending, paid.tool, call.args, result, { paid: true, denied: true, cost: paid.cost });
      responses.push({ functionResponse: { id: call.id, name: call.name, response: { result } } });
      rec.setPlan("approval", "skipped", "You denied the charge. The agent continued without paid data.");
      continue;
    }

    // Re-validate the exact call on the server before any money can move.
    if (!tool || !stillAuthorized || !priceMatches || !withinBudget) {
      blockedByValidation = true;
      const reason = !tool
        ? "Tool is no longer registered."
        : !stillAuthorized
          ? "Intent policy no longer authorizes this paid tool."
          : !priceMatches
            ? "Stored price does not match the registered tool price."
            : "This charge would exceed the run budget.";
      rec.event("error", `Approval rejected: ${reason}`, { tool: paid.tool });
      const blocked = rec.beginStep(paid.tool, call.args, true, paid.cost);
      rec.endStep(blocked, paid.tool, call.args, { denied: true, reason }, { paid: true, denied: true, cost: paid.cost });
      responses.push({
        functionResponse: { id: call.id, name: call.name, response: { result: { denied: true, reason } } },
      });
      continue;
    }

    const pending = rec.beginStep(paid.tool, call.args, true, paid.cost);
    try {
      const result = await executeTool(tool, call.args, { baseUrl: input.baseUrl });
      rec.endStep(pending, paid.tool, call.args, result, { paid: true, cost: paid.cost });
      rec.spentUsdc += paid.priceUsdc;
      const payment = (result as { payment?: { txHash?: string; amount?: string } })?.payment;
      rec.event(
        "approval_decision",
        payment?.txHash
          ? `${paid.tool} settled on-chain: ${payment.amount ?? paid.cost} · tx ${payment.txHash}`
          : `${paid.tool} ran after approval (${paid.cost}).`,
        { tool: paid.tool, amount: payment?.amount ?? paid.cost, ok: true }
      );
      responses.push({ functionResponse: { id: call.id, name: call.name, response: { result } } });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      rec.endStep(pending, paid.tool, call.args, { error: message }, { error: true, paid: true, cost: paid.cost });
      responses.push({
        functionResponse: { id: call.id, name: call.name, response: { result: { error: message } } },
      });
    }
  }

  rec.setPlan(
    "approval",
    blockedByValidation ? "blocked" : decisionApproved ? "complete" : "skipped",
    blockedByValidation
      ? "The stored approval did not match the current tool policy and was refused."
      : decisionApproved
        ? "Approved for this exact call. Single-use, server-validated."
        : "Denied — no paid work was executed."
  );

  record.contents.push({ role: "user", parts: responses });
  return advance(record.contents, rec, { baseUrl: input.baseUrl }, record.mode, undefined);
}
