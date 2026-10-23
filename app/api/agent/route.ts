import { MODEL, resumeMission, runMission } from "@/agent/agent";
import { tools } from "@/agent/tools";
import { ApprovalError, type ChatMessage } from "@/agent/types";
import { NETWORK_LABEL, runBudgetUsdc } from "@/agent/recorder";
import { rateLimit } from "@/lib/x402";
import { getWalletAddress } from "@/agent/wallet";

export const runtime = "nodejs";

const MAX_BODY = 20_000;
const MAX_MISSION = 2_000;
const MAX_HISTORY = 8;

const noStore = { "Cache-Control": "no-store" };

// GET /api/agent -> runtime readiness + the tool registry summary.
export async function GET() {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  return Response.json(
    {
      ready: hasKey,
      mode: hasKey ? "live" : "demo",
      model: hasKey ? MODEL : "deterministic demo planner",
      network: NETWORK_LABEL,
      spending: { perRunUsdc: runBudgetUsdc() },
      walletConfigured: Boolean(getWalletAddress()),
      facilitatorConfigured: Boolean(process.env.FACILITATOR_PRIVATE_KEY),
      tools: tools.map((t) => ({
        name: t.name,
        description: t.description,
        cost: t.cost ?? null,
        paid: Boolean(t.cost),
        kind: t.kind,
      })),
    },
    { headers: noStore }
  );
}

function bad(status: number, error: string, extra: Record<string, unknown> = {}) {
  return Response.json({ error, ...extra }, { status, headers: noStore });
}

// POST /api/agent { mission, history? }        -> start a run (may pause for approval)
// POST /api/agent { approvalId, decision }     -> resume with a server-issued id only
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "direct";
  const rl = rateLimit(`agent:${ip}`, 30, 60_000);
  if (!rl.ok) {
    return Response.json(
      { error: "Rate limit exceeded. Try again shortly." },
      { status: 429, headers: { ...noStore, "Retry-After": String(rl.retryAfterS) } }
    );
  }

  const text = await req.text();
  if (text.length > MAX_BODY) return bad(413, "Request body is too large.");

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(text);
  } catch {
    return bad(400, "Request body must be JSON.");
  }

  const ctx = { baseUrl: new URL(req.url).origin };

  try {
    if (typeof body.approvalId === "string") {
      const decision = body.decision;
      if (decision !== "approved" && decision !== "deny") {
        return bad(400, "Decision must be \"approved\" or \"deny\".");
      }
      // The client supplies an id only. Model state, tool calls and prices are
      // read from the server-side record, so a forged resume cannot execute.
      const result = await resumeMission({ approvalId: body.approvalId, decision, baseUrl: ctx.baseUrl });
      return Response.json(result, { headers: noStore });
    }

    if (typeof body.mission !== "string" || !body.mission.trim()) {
      return bad(400, "A mission string is required.");
    }
    if (body.mission.length > MAX_MISSION) {
      return bad(413, `Mission must be ${MAX_MISSION} characters or fewer.`);
    }

    const history: ChatMessage[] = [];
    if (Array.isArray(body.history)) {
      for (const m of body.history.slice(-MAX_HISTORY)) {
        if (!m || typeof m !== "object") continue;
        const item = m as { role?: unknown; text?: unknown };
        if ((item.role === "user" || item.role === "agent") && typeof item.text === "string") {
          history.push({ role: item.role, text: item.text.slice(0, 4000) });
        }
      }
    }

    const result = await runMission({ mission: body.mission, history, baseUrl: ctx.baseUrl });
    return Response.json(result, { headers: noStore });
  } catch (err) {
    if (err instanceof ApprovalError) return bad(err.status, err.message, { code: err.code });
    const message = err instanceof Error ? err.message : "Agent run failed.";
    return bad(500, message.slice(0, 300));
  }
}
