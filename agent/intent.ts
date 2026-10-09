/**
 * THE INTENT LAYER (prompt pre-processing)
 *
 * Runs before the model ever sees the tool list. It reads the user's latest
 * message and decides which capabilities this turn is allowed to use:
 *
 *   - free tools are ALWAYS available
 *   - paid tools are only advertised when the message clearly asks for that
 *     paid capability ("weather in X", "read my fortune", "research X")
 *
 * So a casual question can never route into a paid API: for that turn the
 * model literally never sees the paid tool — no approval card can pop and
 * no USDC can move. As a second line of defence, agent.ts rejects any tool
 * call the layer did not authorize, even if the model hallucinates one.
 *
 * This layer is deterministic keyword/regex classification on purpose:
 * zero latency, zero cost, and it can never be talked out of its decision
 * by prompt injection in the user's own message.
 */

export type Intent = {
  /** Short label for the UI, e.g. "research", "weather", "general". */
  label: string;
  /** Paid tools this turn is allowed to use (free tools are always allowed). */
  paidAllowed: string[];
  /** One-line human explanation, shown in the chat UI. */
  note: string;
};

export const PAID_TOOL_COSTS: Record<string, string> = {
  get_weather: "0.01 USDC",
  get_fortune: "0.05 USDC",
  research_web: "0.1 USDC",
};

const RULES: { label: string; pattern: RegExp; paid: string[]; note: string }[] = [
  {
    label: "research",
    pattern:
      /\b(research|deep[\s-]?dive|in[\s-]?depth|detailed(\s+\w+)?\s+(report|overview|summary)|cite|sources|investigate|background\s+(on|about)|write\s+(me\s+)?(a\s+)?(report|briefing)|everything\s+about)\b/i,
    paid: ["research_web"],
    note: "deep research requested — research_web (0.1 USDC) available",
  },
  {
    label: "weather",
    pattern: /\b(weather|temperature|forecast|raining|rain\s+in|humidity|how\s+(hot|cold|warm)|weather\s+like)\b/i,
    paid: ["get_weather"],
    note: "weather question — get_weather (0.01 USDC) available",
  },
  {
    label: "fortune",
    pattern: /\b(fortune|horoscope|fortune[\s-]?cookie|my\s+(luck|fate)|tell\s+my\s+future|lucky\s+number)\b/i,
    paid: ["get_fortune"],
    note: "fortune reading — get_fortune (0.05 USDC) available",
  },
  {
    label: "wallet",
    pattern:
      /\b((your|the)\s+wallet|my\s+wallet|balance|balances|how\s+much\s+(eth|usdc|money)|wallet\s+address|your\s+(funds|holdings|address)|what.s\s+in\s+your\s+wallet)\b/i,
    paid: [],
    note: "wallet question — free wallet tools only, nothing can be spent",
  },
];

/** Free fallback: every other question runs on free tools only. */
const GENERAL: Intent = {
  label: "general",
  paidAllowed: [],
  note: "no paid capability requested — free tools only",
};

/** Classify one user message. The first matching rule wins. */
export function classifyIntent(text: string): Intent {
  const t = text ?? "";
  for (const rule of RULES) {
    if (rule.pattern.test(t)) {
      return { label: rule.label, paidAllowed: rule.paid, note: rule.note };
    }
  }
  return GENERAL;
}
