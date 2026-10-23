/**
 * YOUR AGENT'S TOOLS
 *
 * A tool is just a function the agent is allowed to call.
 * Gemini reads the `description` to decide WHEN to use it,
 * and `parameters` to know WHAT to pass in.
 *
 * Add your own tool: copy one of the objects below, change it,
 * and save. It shows up in the "Tools" list on the page.
 */
import { randomInt } from "crypto";
import { getWalletAddress, getWalletBalances, payAndFetch } from "./wallet";
import { searchSources } from "../lib/web";
import { safeFetchJson } from "../lib/x402";
import {
  calculateExpression,
  checkUrlSafety,
  compareSources,
  convertUnits,
  createActionPlan,
  formatJson,
  summarizeText,
} from "../lib/toolkit";

export type Tool = {
  name: string;
  description: string;
  /** JSON Schema describing the inputs. */
  parameters: object;
  /** Set for tools that cost money — their calls pause for user approval. */
  cost?: string;
  /** How the tool does its work — shown in the catalog. */
  kind: "deterministic" | "network" | "wallet" | "paid-api";
  /** A truthful example invocation for the catalog UI. */
  example?: string;
  /** The code that runs when the agent calls this tool. */
  run: (args: any, ctx: { baseUrl: string }) => Promise<unknown>;
};

// ─── country facts source ─────────────────────────────────────────────────
// REST Countries v3.1 was deprecated (301 → "migrate to v5", which needs an
// API key), so facts come from the keyless mledoze/countries dataset on
// jsDelivr — cached in memory for a day — plus the World Bank API for
// population (also keyless). Both hosts are fixed literals; the only
// variable URL segment (the ISO3 code) is strictly validated.
type CountryRecord = {
  name: { common: string; official: string };
  cca2: string;
  cca3: string;
  capital?: string[];
  region?: string;
  subregion?: string;
  flag?: string; // emoji
  altSpellings?: string[];
};
let countriesCache: CountryRecord[] | null = null;
let countriesCachedAt = 0;

async function loadCountries(): Promise<CountryRecord[]> {
  if (countriesCache && Date.now() - countriesCachedAt < 24 * 60 * 60 * 1000) return countriesCache;
  const res = await fetch("https://cdn.jsdelivr.net/gh/mledoze/countries@master/dist/countries.json", {
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Country dataset responded ${res.status}`);
  countriesCache = (await res.json()) as CountryRecord[];
  countriesCachedAt = Date.now();
  return countriesCache;
}

/** Latest population from the World Bank (SP.POP.TOTL); null if unreachable. */
async function populationOf(cca3: string): Promise<{ population: number; asOf: string } | null> {
  if (!/^[A-Z]{3}$/.test(cca3)) return null;
  try {
    const res = await fetch(
      `https://api.worldbank.org/v2/country/${cca3}/indicator/SP.POP.TOTL?format=json&mrnev=1`,
      { signal: AbortSignal.timeout(8_000) }
    );
    if (!res.ok) return null;
    const payload = await res.json();
    const row = Array.isArray(payload) ? payload[1]?.[0] : null;
    return typeof row?.value === "number" ? { population: row.value, asOf: String(row.date) } : null;
  } catch {
    return null;
  }
}

export const tools: Tool[] = [
  // ─── 1. A paid API: the agent's wallet signs a payment to unlock it ───
  {
    name: "get_weather",
    description: "Get the current weather for a city. Costs 0.01 USDC, paid from the agent's testnet wallet after your approval.",
    cost: "0.01 USDC",
    kind: "paid-api",
    example: '"weather in Mumbai"',
    parameters: {
      type: "object",
      properties: {
        city: { type: "string", description: "City name, e.g. Mumbai" },
      },
      required: ["city"],
    },
    run: async ({ city }, { baseUrl }) => {
      return payAndFetch(`${baseUrl}/api/weather?city=${encodeURIComponent(city)}`);
    },
  },

  // ─── 2. A second paid API I built, same x402 pattern, higher stakes ───
  {
    name: "get_fortune",
    description: "Get the agent's secret degen fortune (a crypto fortune-cookie reading). Costs 0.05 USDC, paid after your approval.",
    cost: "0.05 USDC",
    kind: "paid-api",
    parameters: { type: "object", properties: {} },
    run: async (_args, { baseUrl }) => payAndFetch(`${baseUrl}/api/fortune`),
  },

  // ─── 3. Wallet tool: read the agent's own wallet ───
  {
    name: "get_my_wallet",
    kind: "wallet",
    description:
      "Get the agent's own wallet address and its balances: native ETH and USDC on Base Sepolia (its home testnet), plus any USDC that a faucet sent to Ethereum Sepolia instead.",
    parameters: { type: "object", properties: {} },
    run: async () => {
      const balances = await getWalletBalances();
      const busy = "unavailable (balance node busy — try again)";
      return {
        address: getWalletAddress(),
        eth: balances.eth ?? busy,
        usdc: balances.usdc ?? busy,
        usdcOnEthereumSepolia: balances.usdcEthereumSepolia,
        rpcError: balances.rpcError,
        network: "Base Sepolia (testnet)",
      };
    },
  },

  // ─── 4. Live crypto prices from a real free API ───
  {
    name: "get_crypto_price",
    kind: "network",
    description: "Get the current price of a cryptocurrency in USD or another fiat currency, using the free CoinGecko API.",
    parameters: {
      type: "object",
      properties: {
        coin: { type: "string", description: "Coin id on CoinGecko, e.g. ethereum, bitcoin, solana" },
        currency: { type: "string", description: "Fiat currency, default usd" },
      },
      required: ["coin"],
    },
    run: async ({ coin, currency = "usd" }) => {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(coin)}&vs_currencies=${encodeURIComponent(currency)}`,
        { signal: AbortSignal.timeout(10_000) }
      );
      if (!res.ok) throw new Error(`CoinGecko said ${res.status}. Is "${coin}" a valid coin id?`);
      const data = await res.json();
      if (!data[coin]) throw new Error(`No price found for "${coin}". Try ethereum, bitcoin or solana.`);
      return { coin, ...data[coin] };
    },
  },

  // ─── 5. Country facts, straight from the builder guide ───
  {
    name: "get_country_info",
    kind: "network",
    description: "Get facts about a country, including its capital and population.",
    parameters: {
      type: "object",
      properties: {
        country: {
          type: "string",
          description: "Country name, e.g. India",
        },
      },
      required: ["country"],
    },
    run: async ({ country }) => {
      const q = String(country).trim().toLowerCase();
      if (!q) throw new Error("Which country?");
      const list = await loadCountries();
      const names = (c: CountryRecord) =>
        [c.name?.common, c.name?.official, ...(c.altSpellings ?? []), c.cca2, c.cca3].filter(Boolean) as string[];
      const hit =
        list.find((c) => names(c).some((n) => n.toLowerCase() === q)) ??
        (q.length >= 4 ? list.find((c) => names(c).some((n) => n.toLowerCase().includes(q))) : undefined);
      if (!hit) throw new Error(`Could not find a country called "${country}".`);
      const pop = hit.cca3 ? await populationOf(hit.cca3) : null;
      return {
        name: hit.name.common,
        officialName: hit.name.official,
        capital: hit.capital?.[0] ?? null,
        region: hit.region ?? null,
        subregion: hit.subregion ?? null,
        population: pop?.population ?? null,
        populationAsOf: pop?.asOf ?? null,
        flag: hit.flag ?? null,
      };
    },
  },

  // ─── 6. A plain tool: no wallet, no API ───
  {
    name: "get_joke",
    kind: "network",
    description: "Get a random programming-friendly joke. Use when the user wants a joke.",
    parameters: { type: "object", properties: {} },
    run: async () => {
      const res = await fetch("https://official-joke-api.appspot.com/random_joke", { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) throw new Error(`Joke API said ${res.status}. Try again.`);
      return res.json();
    },
  },

  // ─── 8. Free quick search: Wikipedia + Hacker News ───
  {
    name: "web_search",
    kind: "network",
    description: "Search the web for quick hits: Wikipedia articles and Hacker News stories. Returns titles, links and sources. Free.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "What to search for" },
      },
      required: ["query"],
    },
    run: async ({ query }) => {
      const hits = await searchSources(safeFetchJson, String(query));
      if (hits.length === 0) throw new Error(`No results for "${query}".`);
      return { query, results: hits };
    },
  },

  // ─── 9. PAID deep research: the agent's browser ───
  {
    name: "research_web",
    kind: "paid-api",
    description:
      "Deep web research: searches multiple sources, crawls the top pages, extracts their text and returns structured findings with sources. Use for questions that need real reading, not just quick hits. Costs 0.1 USDC, charged after the user approves.",
    cost: "0.1 USDC",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Research question or topic" },
      },
      required: ["query"],
    },
    run: async ({ query }, { baseUrl }) =>
      payAndFetch(`${baseUrl}/api/research?q=${encodeURIComponent(String(query))}`),
  },

  // ─── 10. Another plain tool: pure code, no network at all ───
  {
    name: "roll_dice",
    kind: "deterministic",
    description: "Roll a dice with the given number of sides.",
    parameters: {
      type: "object",
      properties: {
        sides: { type: "number", description: "How many sides the dice has. Default 6." },
      },
    },
    run: async ({ sides = 6 }) => ({ rolled: randomInt(1, sides + 1), sides }),
  },

  // ─── 11. Deterministic math: a real parser, never eval ───
  {
    name: "calculate_expression",
    description:
      "Evaluate a numeric arithmetic expression safely (numbers, parentheses, + - * / % ^ only). Use for any calculation instead of guessing. Never executes code.",
    kind: "deterministic",
    example: '"calculate_expression": { "expression": "(18 * 4) / 3" }',
    parameters: {
      type: "object",
      properties: {
        expression: { type: "string", description: "Arithmetic expression, e.g. (18 * 4) / 3 or 2^10" },
      },
      required: ["expression"],
    },
    run: async ({ expression }) => calculateExpression(String(expression ?? "")),
  },

  // ─── 12. Deterministic unit conversion ───
  {
    name: "convert_units",
    description:
      "Convert a value between documented units of length, mass, volume, time, data size, speed, area or temperature. Rejects incompatible dimensions.",
    kind: "deterministic",
    example: '"convert_units": { "value": 12, "from": "km", "to": "mi" }',
    parameters: {
      type: "object",
      properties: {
        value: { type: "number", description: "Numeric value to convert" },
        from: { type: "string", description: "Source unit, e.g. km, lb, c, GB" },
        to: { type: "string", description: "Target unit, e.g. mi, kg, f, MB" },
      },
      required: ["value", "from", "to"],
    },
    run: async ({ value, from, to }) => convertUnits(Number(value), String(from ?? ""), String(to ?? "")),
  },

  // ─── 13. Deterministic JSON validation/formatting ───
  {
    name: "format_json",
    description:
      "Validate and pretty-print a JSON string. Reports syntax errors without echoing the input. Use when the user pastes JSON or asks to check/format it.",
    kind: "deterministic",
    example: '"format_json": { "json": "{\\"a\\":1}" }',
    parameters: {
      type: "object",
      properties: {
        json: { type: "string", description: "JSON text to parse and format" },
        indent: { type: "number", description: "Indent width: 2 (default) or 4" },
      },
      required: ["json"],
    },
    run: async ({ json, indent }) =>
      formatJson(String(json ?? ""), Number(indent) === 4 ? 4 : 2),
  },

  // ─── 14. Deterministic extractive summary (no LLM call) ───
  {
    name: "summarize_text",
    description:
      "Produce a transparent extractive summary of supplied text (deterministic sentence scoring, not generative). Returns the sentences it selected and the compression ratio.",
    kind: "deterministic",
    example: '"summarize_text": { "text": "<article>", "max_sentences": 3 }',
    parameters: {
      type: "object",
      properties: {
        text: { type: "string", description: "Text to summarize" },
        max_sentences: { type: "number", description: "1-8 sentences, default 4" },
      },
      required: ["text"],
    },
    run: async ({ text, max_sentences }) => summarizeText(String(text ?? ""), Number(max_sentences) || 4),
  },

  // ─── 15. Structured checklist generation (never auto-runs) ───
  {
    name: "create_action_plan",
    description:
      "Turn a goal plus explicit steps into a validated, ordered checklist with pending states. It only creates the plan — it never executes the steps.",
    kind: "deterministic",
    example: '"create_action_plan": { "goal": "Ship briefing", "steps": ["Collect sources", "Draft"] }',
    parameters: {
      type: "object",
      properties: {
        goal: { type: "string", description: "The outcome the plan is for" },
        steps: { type: "array", items: { type: "string" }, description: "1-12 concrete steps, in order" },
      },
      required: ["goal", "steps"],
    },
    run: async ({ goal, steps }) => createActionPlan(String(goal ?? ""), Array.isArray(steps) ? steps.map(String) : []),
  },

  // ─── 16. URL syntax safety (never fetches) ───
  {
    name: "check_url_safety",
    description:
      "Check a URL's syntax, scheme and hostname for obvious risk (private hosts, credentials, unsupported schemes). It does not fetch the URL and is not a malware scanner.",
    kind: "deterministic",
    example: '"check_url_safety": { "url": "https://example.com" }',
    parameters: {
      type: "object",
      properties: { url: { type: "string", description: "Absolute URL to inspect" } },
      required: ["url"],
    },
    run: async ({ url }) => checkUrlSafety(String(url ?? "")),
  },

  // ─── 17. Compare only the sources that were actually supplied ───
  {
    name: "compare_sources",
    description:
      "Compare 2-6 already-fetched sources by keyword overlap: shared terms, distinctive terms and question terms missing from every source. Never invents citations.",
    kind: "deterministic",
    example:
      '"compare_sources": { "question": "agent payments", "sources": [{ "title": "A", "url": "https://…", "excerpt": "…" }] }',
    parameters: {
      type: "object",
      properties: {
        question: { type: "string", description: "The question being researched" },
        sources: {
          type: "array",
          description: "Sources already returned by search/research",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              url: { type: "string" },
              excerpt: { type: "string" },
            },
            required: ["title", "excerpt"],
          },
        },
      },
      required: ["question", "sources"],
    },
    run: async ({ question, sources }) => compareSources(String(question ?? ""), Array.isArray(sources) ? sources : []),
  },
];
