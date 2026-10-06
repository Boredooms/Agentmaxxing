import { MODEL, runAgent, resumeAgent, type ResumeState } from "@/agent/agent";
import { tools } from "@/agent/tools";
import { rateLimit } from "@/lib/x402";

// GET /api/agent -> setup status + the list of tools (shown on the page)
export async function GET() {
  return Response.json({
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    model: MODEL,
    tools: tools.map((t) => ({ name: t.name, description: t.description })),
  });
}

/** Wrap an advance result: pending turns carry the calls + resumable state. */
function shape(result: Awaited<ReturnType<typeof runAgent>>) {
  if ("pending" in result) {
    return {
      pending: true,
      calls: result.pending,
      resume: { contents: result.contents, steps: result.steps } satisfies ResumeState,
    };
  }
  return result;
}

// POST /api/agent { messages }            -> start a turn (may pause for payment approval)
// POST /api/agent { resume, decision }    -> continue a paused turn after approve/deny
export async function POST(req: Request) {
  // basic abuse guard: the endpoint fronts a paid LLM API
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "direct";
  const rl = rateLimit(`agent:${ip}`, 30, 60_000);
  if (!rl.ok) {
    return Response.json({ error: "Rate limit exceeded. Try again shortly." }, { status: 429, headers: { "Retry-After": String(rl.retryAfterS) } });
  }

  if (!process.env.GEMINI_API_KEY) {
    return Response.json({ error: "Add GEMINI_API_KEY to your .env file, then restart `npm run dev`." }, { status: 500 });
  }

  const body = await req.json();
  const ctx = { baseUrl: new URL(req.url).origin };
  try {
    if (body.resume) {
      const contents = body.resume.contents;
      if (!Array.isArray(contents) || contents.length === 0 || contents.length > 30) {
        return Response.json({ error: "Invalid resume state." }, { status: 400 });
      }
      const decision = body.resume.decision === "approved" ? "approved" : "deny";
      const result = await resumeAgent({ contents, steps: body.resume.steps ?? [], decision }, ctx);
      return Response.json(shape(result));
    }

    const result = await runAgent(body.messages, ctx);
    return Response.json(shape(result));
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
