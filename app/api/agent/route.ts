import { MODEL, runAgent } from "@/agent/agent";
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

// POST /api/agent { messages } -> the agent's answer + the tools it used
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

  const { messages } = await req.json();
  try {
    const result = await runAgent(messages, { baseUrl: new URL(req.url).origin });
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
