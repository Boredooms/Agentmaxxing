/**
 * THE AGENT
 *
 * An agent is a loop:
 *   1. Send the chat + the list of tools to Gemini.
 *   2. If Gemini wants to call a tool -> run it, send back the result, repeat.
 *   3. If Gemini answers with text -> done.
 *
 * Human in the loop: if Gemini asks for a PAID tool, the loop pauses and
 * returns the pending calls + a serialized resume state. The UI shows an
 * approval card; the client resumes the turn with approved/deny and the loop
 * continues exactly where it stopped (stateless round-trip, serverless-safe).
 */
import { GoogleGenAI, type Content, type Part } from "@google/genai";
import { tools } from "./tools";
import { classifyIntent, type Intent } from "./intent";

export const MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";
const MAX_STEPS = 5;

const SYSTEM_PROMPT =
  "You are Maxx, the Agentmaxxing agent — a confident, slightly degen but genuinely helpful AI agent " +
  "with its own crypto wallet on Base Sepolia (testnet). You have real tools and real (test) money. " +
  "An intent layer runs before you: each turn you only see the tools that request actually needs. " +
  "Paid tools appear ONLY when the user clearly asked for that paid capability; on every other turn you " +
  "get free tools only — never promise or attempt a paid tool you were not given, and never suggest spending " +
  "money unless the user asked for the paid feature. If a tool you need is missing, answer with what you have " +
  "and say honestly that the deeper (paid) version wasn't unlocked for this request. " +
  "Paid tools ask the user for approval in the UI before any money moves; if the user denies a payment, " +
  "accept it gracefully and answer without that data (maybe suggest a free alternative). " +
  "For quick facts use web_search (free). For questions needing real reading, use research_web: it crawls " +
  "pages and returns structured findings with sources — cite those sources in your answer. " +
  "After using a tool, tell the user what you did and what you got back, and mention what you spent if it was paid. " +
  "If you don't have a tool for something, say so honestly instead of making things up. " +
  "Keep answers short, friendly and a little fun. You may use one emoji max.";

export type ChatMessage = { role: "user" | "agent"; text: string };
export type Step = { tool: string; args: unknown; result: unknown; error?: boolean };
export type PendingCall = { tool: string; args: unknown; cost?: string };
/** Everything needed to continue a paused turn, round-tripped via the client. */
export type ResumeState = { contents: Content[]; steps: Step[] };

// Token window for chat memory: rough ~4 chars/token heuristic. Newest
// messages win; short chats are never trimmed.
const MAX_HISTORY_TOKENS = 6000;
const approxTokens = (s: string) => Math.ceil((s?.length ?? 0) / 4);

function trimHistory(history: ChatMessage[]): ChatMessage[] {
  if (history.length <= 4) return history;
  let total = 0;
  const kept: ChatMessage[] = [];
  for (let i = history.length - 1; i >= 0; i--) {
    const cost = approxTokens(history[i].text.slice(-4000)) + 8;
    if (total + cost > MAX_HISTORY_TOKENS && kept.length >= 4) break;
    total += cost;
    kept.unshift(history[i]);
  }
  return kept;
}

type AdvanceResult =
  | { answer: string; steps: Step[]; intent: { label: string; note: string } }
  | { pending: PendingCall[]; contents: Content[]; steps: Step[] };

const costOf = (name: string) => tools.find((t) => t.name === name)?.cost;

/** The last actual user sentence in `contents` (skipping function responses,
 *  which are also role:"user" parts) — what the intent layer classifies. */
function latestUserText(contents: Content[]): string {
  for (let i = contents.length - 1; i >= 0; i--) {
    const c = contents[i];
    if (c.role !== "user") continue;
    const text = (c.parts ?? []).find((p) => typeof p.text === "string" && !p.functionResponse)?.text;
    if (text) return text;
  }
  return "";
}

async function advance(contents: Content[], steps: Step[], ctx: { baseUrl: string }, intent: Intent): Promise<AdvanceResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // The intent layer gates the toolbox: paid tools are only advertised on
  // turns that clearly asked for them. Free tools are always advertised.
  const authorized = new Set(tools.filter((t) => !t.cost || intent.paidAllowed.includes(t.name)).map((t) => t.name));
  const declarations = tools
    .filter((t) => authorized.has(t.name))
    .map((t) => ({
      name: t.name,
      description: t.description,
      parametersJsonSchema: t.parameters,
    }));

  for (let i = 0; i < MAX_STEPS; i++) {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools: [{ functionDeclarations: declarations }],
      },
    });

    const calls = response.functionCalls ?? [];
    if (calls.length === 0) return { answer: response.text ?? "", steps, intent };

    // Keep Gemini's turn in the history...
    contents.push(response.candidates![0].content!);

    // ...then pause if any requested call costs money — the user decides.
    // (Only authorized paid tools can reach here; unauthorized names are
    // rejected below instead of ever reaching an approval card.)
    const authorizedPaid = calls.filter((c) => authorized.has(c.name!) && costOf(c.name!));
    if (authorizedPaid.length > 0) {
      return {
        pending: calls.map((c) => ({ tool: c.name!, args: c.args, cost: costOf(c.name!) })),
        contents,
        steps,
      };
    }

    // Free tools just run. Anything the intent layer didn't authorize (e.g. a
    // hallucinated tool name, or a paid tool on a free-only turn) is refused
    // with a structured error so the model can answer without it.
    const results: Part[] = [];
    for (const call of calls) {
      const tool = tools.find((t) => t.name === call.name);
      let result: unknown;
      let error = false;
      try {
        if (!tool) throw new Error(`No tool named ${call.name}`);
        if (!authorized.has(call.name!)) {
          throw new Error(
            `Tool ${call.name} is not available for this request — the user did not ask for a paid capability. Answer with the free tools you have.`
          );
        }
        result = await tool.run(call.args ?? {}, ctx);
      } catch (err) {
        result = { error: err instanceof Error ? err.message : String(err) };
        error = true;
      }
      steps.push({ tool: call.name!, args: call.args, result, error });
      results.push({ functionResponse: { id: call.id, name: call.name, response: { result } } });
    }
    contents.push({ role: "user", parts: results });
  }

  return { answer: "I hit my step limit. Try a simpler question.", steps, intent };
}

/** Start a new turn from the chat history. May come back pending approval. */
export async function runAgent(rawHistory: ChatMessage[], ctx: { baseUrl: string }) {
  const history = trimHistory(rawHistory);
  const contents: Content[] = history.map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.text.slice(-4000) }],
  }));
  // Intent layer: classify what the user is actually asking for before the
  // model sees any tools — this decides whether paid tools exist this turn.
  const lastUser = [...history].reverse().find((m) => m.role === "user");
  return advance(contents, [], ctx, classifyIntent(lastUser?.text ?? ""));
}

/** Continue a paused turn after the user approved or denied the payment(s). */
export async function resumeAgent(
  resume: ResumeState & { decision: "approved" | "deny" },
  ctx: { baseUrl: string }
) {
  const contents = resume.contents;
  const steps = [...resume.steps];
  // Re-derive the turn's intent from the original user message still in
  // `contents` so post-approval steps run under the same authorization.
  const intent = classifyIntent(latestUserText(contents));
  const last = contents[contents.length - 1];
  const calls = (last?.parts ?? []).flatMap((p) => (p.functionCall ? [p.functionCall] : []));

  const results: Part[] = [];
  for (const call of calls) {
    const tool = tools.find((t) => t.name === call.name);
    let result: unknown;
    let error = false;
    if (resume.decision === "deny") {
      result = { denied: true, reason: "The user declined this payment." };
    } else {
      try {
        if (!tool) throw new Error(`No tool named ${call.name}`);
        result = await tool.run(call.args ?? {}, ctx);
      } catch (err) {
        result = { error: err instanceof Error ? err.message : String(err) };
        error = true;
      }
    }
    steps.push({ tool: call.name!, args: call.args, result, error });
    results.push({ functionResponse: { id: call.id, name: call.name, response: { result } } });
  }
  contents.push({ role: "user", parts: results });

  return advance(contents, steps, ctx, intent);
}
