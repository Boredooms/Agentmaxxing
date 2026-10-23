/**
 * DETERMINISTIC TOOLKIT
 *
 * Pure functions the agent can call. No network, no eval, no LLM — every
 * answer here is reproducible and unit-tested. Keeping this file free of
 * imports lets `node --test` execute it directly (Node strips the types).
 */

// ─── calculate_expression ────────────────────────────────────────────────
// A tiny recursive-descent parser. Supports numeric literals, parentheses,
// + - * / % ^ and unary signs. Identifiers, property access, calls and
// anything else are rejected. There is no eval/Function anywhere.

type Token = { kind: "number"; value: number } | { kind: "op"; value: string };

export type CalculationResult = {
  expression: string;
  normalized: string;
  value: number;
};

function tokenizeExpression(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const s = input.trim();
  if (s.length === 0) throw new Error("Expression is empty.");
  if (s.length > 200) throw new Error("Expression is too long (max 200 characters).");

  while (i < s.length) {
    const ch = s[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      const start = i;
      let seenDot = false;
      while (i < s.length && /[0-9.]/.test(s[i])) {
        if (s[i] === ".") {
          if (seenDot) throw new Error("Malformed number: more than one decimal point.");
          seenDot = true;
        }
        i++;
      }
      // optional exponent
      if (i < s.length && /[eE]/.test(s[i])) {
        const expStart = i;
        i++;
        if (s[i] === "+" || s[i] === "-") i++;
        if (!/[0-9]/.test(s[i] ?? "")) {
          i = expStart;
        } else {
          while (i < s.length && /[0-9]/.test(s[i])) i++;
        }
      }
      const raw = s.slice(start, i);
      if (raw === "." || raw.endsWith(".") && raw.length === 1) throw new Error(`Malformed number: ${raw}`);
      const value = Number(raw);
      if (!Number.isFinite(value)) throw new Error(`Number out of range: ${raw}`);
      tokens.push({ kind: "number", value });
      continue;
    }
    if ("+-*/%^()".includes(ch)) {
      tokens.push({ kind: "op", value: ch });
      i++;
      continue;
    }
    throw new Error(`Unsupported character "${ch}". Only numbers, + - * / % ^ and parentheses are allowed.`);
  }
  return tokens;
}

function evaluateExpression(input: string): number {
  const tokens = tokenizeExpression(input);
  let pos = 0;

  const peek = () => tokens[pos];
  const eat = (op?: string): Token => {
    const t = tokens[pos];
    if (!t) throw new Error("Expression ended early.");
    if (op && !(t.kind === "op" && t.value === op)) throw new Error(`Expected "${op}".`);
    pos++;
    return t;
  };

  function parseExpr(): number {
    let left = parseTerm();
    while (peek()?.kind === "op" && (peek() as { value: string }).value.match(/^[+-]$/)) {
      const op = (eat() as { value: string }).value;
      const right = parseTerm();
      left = op === "+" ? left + right : left - right;
    }
    return left;
  }

  function parseTerm(): number {
    let left = parseUnary();
    while (peek()?.kind === "op" && (peek() as { value: string }).value.match(/^[*/%]$/)) {
      const op = (eat() as { value: string }).value;
      const right = parseUnary();
      if ((op === "/" || op === "%") && right === 0) throw new Error("Division by zero.");
      left = op === "*" ? left * right : op === "/" ? left / right : left % right;
    }
    return left;
  }

  function parseUnary(): number {
    const t = peek();
    if (t?.kind === "op" && (t.value === "+" || t.value === "-")) {
      eat();
      const v = parseUnary();
      return t.value === "-" ? -v : v;
    }
    return parsePower();
  }

  // right-associative: 2^3^2 = 2^9
  function parsePower(): number {
    const base = parsePrimary();
    if (peek()?.kind === "op" && (peek() as { value: string }).value === "^") {
      eat("^");
      const exp = parseUnary();
      return Math.pow(base, exp);
    }
    return base;
  }

  function parsePrimary(): number {
    const t = peek();
    if (!t) throw new Error("Expression ended early.");
    if (t.kind === "number") {
      eat();
      return t.value;
    }
    if (t.value === "(") {
      eat("(");
      const v = parseExpr();
      eat(")");
      return v;
    }
    throw new Error(`Unexpected "${t.value}".`);
  }

  const result = parseExpr();
  if (pos !== tokens.length) throw new Error("Malformed expression: unexpected trailing input.");
  if (!Number.isFinite(result)) throw new Error("Result is not a finite number.");
  return result;
}

export function calculateExpression(expression: string): CalculationResult {
  const value = evaluateExpression(String(expression));
  return {
    expression: String(expression).trim(),
    normalized: String(expression).replace(/\s+/g, ""),
    value: Number(value.toPrecision(15)),
  };
}

// ─── convert_units ───────────────────────────────────────────────────────
type Dimension = "length" | "mass" | "volume" | "time" | "data" | "temperature" | "speed" | "area";

type UnitDef = { dimension: Dimension; factor?: number };

const UNITS: Record<string, UnitDef> = {
  // length (base: metre)
  m: { dimension: "length", factor: 1 },
  meter: { dimension: "length", factor: 1 },
  meters: { dimension: "length", factor: 1 },
  km: { dimension: "length", factor: 1000 },
  kilometer: { dimension: "length", factor: 1000 },
  kilometers: { dimension: "length", factor: 1000 },
  cm: { dimension: "length", factor: 0.01 },
  mm: { dimension: "length", factor: 0.001 },
  mi: { dimension: "length", factor: 1609.344 },
  mile: { dimension: "length", factor: 1609.344 },
  miles: { dimension: "length", factor: 1609.344 },
  ft: { dimension: "length", factor: 0.3048 },
  feet: { dimension: "length", factor: 0.3048 },
  in: { dimension: "length", factor: 0.0254 },
  inch: { dimension: "length", factor: 0.0254 },
  inches: { dimension: "length", factor: 0.0254 },
  yd: { dimension: "length", factor: 0.9144 },
  // mass (base: kilogram)
  kg: { dimension: "mass", factor: 1 },
  kilogram: { dimension: "mass", factor: 1 },
  g: { dimension: "mass", factor: 0.001 },
  mg: { dimension: "mass", factor: 1e-6 },
  lb: { dimension: "mass", factor: 0.45359237 },
  lbs: { dimension: "mass", factor: 0.45359237 },
  oz: { dimension: "mass", factor: 0.028349523125 },
  // volume (base: litre)
  l: { dimension: "volume", factor: 1 },
  liter: { dimension: "volume", factor: 1 },
  litre: { dimension: "volume", factor: 1 },
  ml: { dimension: "volume", factor: 0.001 },
  gal: { dimension: "volume", factor: 3.785411784 },
  gallon: { dimension: "volume", factor: 3.785411784 },
  qt: { dimension: "volume", factor: 0.946352946 },
  cup: { dimension: "volume", factor: 0.2365882365 },
  // time (base: second)
  s: { dimension: "time", factor: 1 },
  sec: { dimension: "time", factor: 1 },
  second: { dimension: "time", factor: 1 },
  seconds: { dimension: "time", factor: 1 },
  min: { dimension: "time", factor: 60 },
  minute: { dimension: "time", factor: 60 },
  minutes: { dimension: "time", factor: 60 },
  h: { dimension: "time", factor: 3600 },
  hr: { dimension: "time", factor: 3600 },
  hour: { dimension: "time", factor: 3600 },
  hours: { dimension: "time", factor: 3600 },
  day: { dimension: "time", factor: 86400 },
  days: { dimension: "time", factor: 86400 },
  // data (base: byte, binary multiples — documented)
  b: { dimension: "data", factor: 1 },
  byte: { dimension: "data", factor: 1 },
  bytes: { dimension: "data", factor: 1 },
  kb: { dimension: "data", factor: 1024 },
  mb: { dimension: "data", factor: 1024 ** 2 },
  gb: { dimension: "data", factor: 1024 ** 3 },
  tb: { dimension: "data", factor: 1024 ** 4 },
  kib: { dimension: "data", factor: 1024 },
  mib: { dimension: "data", factor: 1024 ** 2 },
  gib: { dimension: "data", factor: 1024 ** 3 },
  // speed (base: metre/second)
  "m/s": { dimension: "speed", factor: 1 },
  "km/h": { dimension: "speed", factor: 1 / 3.6 },
  kph: { dimension: "speed", factor: 1 / 3.6 },
  mph: { dimension: "speed", factor: 0.44704 },
  knot: { dimension: "speed", factor: 0.514444 },
  // area (base: square metre)
  m2: { dimension: "area", factor: 1 },
  km2: { dimension: "area", factor: 1e6 },
  ft2: { dimension: "area", factor: 0.09290304 },
  acre: { dimension: "area", factor: 4046.8564224 },
  ha: { dimension: "area", factor: 10000 },
  // temperature handled separately (offset scales)
  c: { dimension: "temperature" },
  celsius: { dimension: "temperature" },
  "°c": { dimension: "temperature" },
  f: { dimension: "temperature" },
  fahrenheit: { dimension: "temperature" },
  "°f": { dimension: "temperature" },
  k: { dimension: "temperature" },
  kelvin: { dimension: "temperature" },
};

function normalizeUnit(unit: string): string {
  return String(unit)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/degrees?/, "")
    .replace(/^deg/, "")
    .replace(/−/g, "-");
}

const TEMP_ALIASES: Record<string, "c" | "f" | "k"> = {
  c: "c",
  "°c": "c",
  celsius: "c",
  f: "f",
  "°f": "f",
  fahrenheit: "f",
  k: "k",
  kelvin: "k",
};

export type ConversionResult = {
  value: number;
  from: string;
  to: string;
  result: number;
  dimension: Dimension;
  formula: string;
};

function toCelsius(value: number, unit: "c" | "f" | "k"): number {
  if (unit === "c") return value;
  if (unit === "f") return ((value - 32) * 5) / 9;
  return value - 273.15;
}

function fromCelsius(celsius: number, unit: "c" | "f" | "k"): number {
  if (unit === "c") return celsius;
  if (unit === "f") return (celsius * 9) / 5 + 32;
  return celsius + 273.15;
}

export function convertUnits(value: number, from: string, to: string): ConversionResult {
  if (!Number.isFinite(value)) throw new Error("Value must be a finite number.");
  const rawFrom = String(from);
  const rawTo = String(to);
  const f = TEMP_ALIASES[normalizeUnit(rawFrom)];
  const t = TEMP_ALIASES[normalizeUnit(rawTo)];
  if (f && t) {
    const celsius = toCelsius(value, f);
    const result = fromCelsius(celsius, t);
    return {
      value,
      from: rawFrom,
      to: rawTo,
      result: Number(result.toPrecision(10)),
      dimension: "temperature",
      formula: f === "c" ? "°C → target" : `${f.toUpperCase()} → °C → ${t.toUpperCase()}`,
    };
  }

  const fromDef = UNITS[normalizeUnit(rawFrom)];
  const toDef = UNITS[normalizeUnit(rawTo)];
  if (!fromDef) throw new Error(`Unknown unit "${from}".`);
  if (!toDef) throw new Error(`Unknown unit "${to}".`);
  if (fromDef.dimension !== toDef.dimension) {
    throw new Error(`Cannot convert ${fromDef.dimension} (${from}) to ${toDef.dimension} (${to}).`);
  }
  const result = (value * (fromDef.factor ?? 1)) / (toDef.factor ?? 1);
  return {
    value,
    from: rawFrom,
    to: rawTo,
    result: Number(result.toPrecision(10)),
    dimension: fromDef.dimension,
    formula: `value × ${fromDef.factor ?? 1} ÷ ${toDef.factor ?? 1}`,
  };
}

// ─── format_json ─────────────────────────────────────────────────────────
export type JsonFormatResult = {
  valid: true;
  formatted: string;
  bytes: number;
  topLevelType: "object" | "array" | "string" | "number" | "boolean" | "null";
  keys: number;
};

export function formatJson(input: string, indent: 2 | 4 = 2): JsonFormatResult {
  const text = String(input);
  if (text.length > 100_000) throw new Error("JSON input is too large (max 100,000 characters).");
  if (!text.trim()) throw new Error("JSON input is empty.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    const position = msg.match(/position\s+(\d+)/i)?.[1];
    throw new Error(
      `Invalid JSON${position ? ` near character ${position}` : ""}. Check quotes, commas and trailing braces.`
    );
  }
  const formatted = JSON.stringify(parsed, null, indent === 4 ? 4 : 2);
  return {
    valid: true,
    formatted,
    bytes: new TextEncoder().encode(formatted).length,
    topLevelType: parsed === null ? "null" : Array.isArray(parsed) ? "array" : (typeof parsed as JsonFormatResult["topLevelType"]),
    keys: parsed && typeof parsed === "object" && !Array.isArray(parsed) ? Object.keys(parsed).length : 0,
  };
}

// ─── summarize_text ──────────────────────────────────────────────────────
const SUMMARY_STOPWORDS = new Set(
  "the a an and or but if then than that this these those is are was were be been being to of in on at for from with by as it its into about over under again further once here there when where why how all any both each few more most other some such no nor not only own same so too very can will just should now".split(
    " "
  )
);

export type SummaryResult = {
  summary: string;
  pickedSentences: string[];
  sourceSentences: number;
  originalChars: number;
  summaryChars: number;
  method: "deterministic-extractive";
};

export function summarizeText(text: string, maxSentences = 4): SummaryResult {
  const input = String(text).replace(/\s+/g, " ").trim();
  if (!input) throw new Error("Nothing to summarize.");
  if (input.length > 50_000) throw new Error("Text is too long to summarize (max 50,000 characters).");
  const cap = Math.max(1, Math.min(8, Math.floor(Number(maxSentences) || 4)));

  const sentences = input
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"“(])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (sentences.length <= cap) {
    const summary = sentences.join(" ");
    return {
      summary,
      pickedSentences: sentences,
      sourceSentences: sentences.length,
      originalChars: input.length,
      summaryChars: summary.length,
      method: "deterministic-extractive",
    };
  }

  const words = input.toLowerCase().match(/[a-z][a-z'-]{2,}/g) ?? [];
  const freq = new Map<string, number>();
  for (const word of words) {
    if (SUMMARY_STOPWORDS.has(word)) continue;
    freq.set(word, (freq.get(word) ?? 0) + 1);
  }

  const scored = sentences.map((sentence, index) => {
    const tokens = sentence.toLowerCase().match(/[a-z][a-z'-]{2,}/g) ?? [];
    const meaningful = tokens.filter((w) => !SUMMARY_STOPWORDS.has(w));
    const score = meaningful.reduce((sum, w) => sum + (freq.get(w) ?? 0), 0) / Math.sqrt(Math.max(1, meaningful.length));
    // Earlier sentences carry slightly more weight in expository text.
    return { sentence, index, score: score * (1 + 0.05 * (sentences.length - index)) };
  });

  const picked = [...scored]
    .sort((a, b) => b.score - a.score)
    .slice(0, cap)
    .sort((a, b) => a.index - b.index);
  const summary = picked.map((p) => p.sentence).join(" ");
  return {
    summary,
    pickedSentences: picked.map((p) => p.sentence),
    sourceSentences: sentences.length,
    originalChars: input.length,
    summaryChars: summary.length,
    method: "deterministic-extractive",
  };
}

// ─── create_action_plan ──────────────────────────────────────────────────
export type ActionPlanItem = { id: string; order: number; title: string; status: "pending"; done: false };

export function createActionPlan(goal: string, steps: string[]): { goal: string; items: ActionPlanItem[]; note: string } {
  const cleanGoal = String(goal ?? "").replace(/\s+/g, " ").trim().slice(0, 300);
  if (!cleanGoal) throw new Error("A goal is required.");
  if (!Array.isArray(steps) || steps.length === 0) throw new Error("Provide between 1 and 12 steps.");
  if (steps.length > 12) throw new Error("Too many steps (max 12).");
  const items = steps.map((raw, i) => {
    const title = String(raw).replace(/\s+/g, " ").trim().slice(0, 200);
    if (!title) throw new Error(`Step ${i + 1} is empty.`);
    return { id: `step-${i + 1}`, order: i + 1, title, status: "pending" as const, done: false as const };
  });
  return {
    goal: cleanGoal,
    items,
    note: "Generated checklist only — no step was executed. Mark items done yourself or run the work explicitly.",
  };
}

// ─── check_url_safety (syntax only, never fetches) ───────────────────────
function looksLikePrivateHost(host: string): boolean {
  const h = host.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal")) return true;
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224;
  }
  if (h === "::1" || h === "::" || h.startsWith("fc") || h.startsWith("fd") || /^fe[89ab]/.test(h)) return true;
  return false;
}

export type UrlSafetyResult = {
  url: string;
  safe: boolean;
  protocol: string | null;
  host: string | null;
  warnings: string[];
  note: string;
};

export function checkUrlSafety(rawUrl: string): UrlSafetyResult {
  const url = String(rawUrl ?? "").trim();
  const warnings: string[] = [];
  if (!url) throw new Error("URL is required.");
  if (url.length > 2048) throw new Error("URL is too long (max 2048 characters).");
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { url, safe: false, protocol: null, host: null, warnings: ["Not a valid absolute URL."], note: "Syntax check only — nothing was fetched." };
  }
  const protocol = parsed.protocol.replace(":", "");
  const host = parsed.hostname.toLowerCase();
  if (protocol !== "http" && protocol !== "https") warnings.push(`Unsupported scheme "${protocol}" — only http/https.`);
  if (parsed.username || parsed.password) warnings.push("URL embeds credentials.");
  if (looksLikePrivateHost(host)) warnings.push("Host is loopback/private/reserved.");
  if (host === "") warnings.push("URL has no host.");
  return {
    url: parsed.toString(),
    safe: warnings.length === 0,
    protocol,
    host,
    warnings,
    note: "Syntax and host check only — VANTA did not fetch this URL.",
  };
}

// ─── compare_sources (only the sources actually supplied) ────────────────
export type SourceInput = { title?: string; url?: string; excerpt?: string };

export function compareSources(question: string, sources: SourceInput[]) {
  const list = (Array.isArray(sources) ? sources : []).slice(0, 6);
  if (list.length < 2) throw new Error("Provide at least two sources to compare.");
  const toTerms = (text: string) =>
    new Set(
      (String(text).toLowerCase().match(/[a-z][a-z'-]{3,}/g) ?? []).filter((w) => !SUMMARY_STOPWORDS.has(w))
    );

  const perSource = list.map((source, i) => {
    const terms = toTerms(source.excerpt ?? "");
    return {
      index: i + 1,
      title: source.title ?? `Source ${i + 1}`,
      url: source.url ?? null,
      terms,
    };
  });

  const common = [...perSource[0].terms].filter((term) => perSource.every((s) => s.terms.has(term))).slice(0, 20);

  const distinctive = perSource.map((source) => ({
    title: source.title,
    url: source.url,
    terms: [...source.terms]
      .filter((term) => perSource.filter((s) => s !== source && s.terms.has(term)).length === 0)
      .slice(0, 12),
  }));

  const questionTerms = [...toTerms(question)];
  const allTerms = new Set(perSource.flatMap((s) => [...s.terms]));
  const gaps = questionTerms.filter((t) => !allTerms.has(t)).slice(0, 12);

  return {
    question: String(question ?? "").trim(),
    sourceCount: perSource.length,
    commonTerms: common,
    distinctiveTerms: distinctive,
    gaps,
    note: "Computed only from the excerpts supplied; this is keyword analysis, not fact-checking.",
  };
}
