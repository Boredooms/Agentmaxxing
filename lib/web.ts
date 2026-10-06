/**
 * WEB ACCESS LAYER — search + crawl, all SSRF-guarded.
 *
 * Search: fixed, allowlisted JSON APIs (Wikipedia, Hacker News).
 * Crawl: arbitrary pages but with hard safety rails — http(s) only, ports
 * 80/443 only, no credentials in URLs, host allowlist (env-extendable),
 * DNS resolved and checked against private/reserved ranges BEFORE every
 * connect, manual redirect handling (each hop re-validated), time + size caps.
 */
import dns from "dns/promises";

// ─── search: allowlisted JSON APIs ────────────────────────────────────────
export type SearchHit = { title: string; url: string; source: string };

type WikiSearch = { query?: { search?: Array<{ title: string }> } };
type HnSearch = { hits?: Array<{ title: string | null; url: string | null; objectID: string; points?: number }> };

export async function searchSources(safeFetchJson: (host: any, path: string, params: Record<string, string>) => Promise<unknown>, query: string): Promise<SearchHit[]> {
  const gather = async (q: string): Promise<SearchHit[]> => {
    const [wiki, hn] = await Promise.allSettled([
      safeFetchJson("en.wikipedia.org", "/w/api.php", {
        action: "query",
        list: "search",
        srsearch: q,
        srlimit: "3",
        format: "json",
      }) as Promise<WikiSearch>,
      safeFetchJson("hn.algolia.com", "/api/v1/search", {
        query: q,
        tags: "story",
        hitsPerPage: "3",
      }) as Promise<HnSearch>,
    ]);

    const hits: SearchHit[] = [];
    if (wiki.status === "fulfilled") {
      for (const s of wiki.value.query?.search ?? []) {
        hits.push({
          title: s.title,
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(String(s.title).replace(/ /g, "_"))}`,
          source: "wikipedia",
        });
      }
    }
    if (hn.status === "fulfilled") {
      for (const h of hn.value.hits ?? []) {
        if (!h.title) continue;
        hits.push({
          title: h.title,
          url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
          source: "hackernews",
        });
      }
    }
    return hits;
  };

  // Queries that are too specific return zero hits — relax progressively:
  // full query -> first 4 words -> distinctive keywords (stopwords stripped).
  const attempts = [query];
  const fourWords = query.split(/\s+/).slice(0, 4).join(" ").trim();
  if (fourWords && fourWords.toLowerCase() !== query.trim().toLowerCase()) attempts.push(fourWords);
  const keywords = query
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z0-9-]/g, ""))
    .filter((w) => w.length > 2 && !STOPWORDS.has(w.toLowerCase()))
    .slice(0, 3)
    .join(" ")
    .trim();
  if (keywords && !attempts.includes(keywords)) attempts.push(keywords);
  // Search APIs AND their terms — a single distinctive keyword is the last
  // resort and the most likely to hit (e.g. "EIP-3009 transferWithAuthorization"
  // finds nothing, "EIP-3009" finds plenty).
  const firstKeyword = keywords.split(/\s+/)[0];
  if (firstKeyword && !attempts.includes(firstKeyword)) attempts.push(firstKeyword);

  for (const attempt of attempts) {
    const hits = await gather(attempt);
    if (hits.length > 0) return hits;
  }
  return [];
}

const STOPWORDS = new Set([
  "the", "a", "an", "of", "for", "and", "or", "how", "does", "do", "did", "what", "why", "when", "who",
  "is", "are", "was", "were", "to", "in", "on", "with", "without", "from", "about", "into", "over",
  "work", "works", "working", "explanation", "explain", "tell", "me", "use", "used", "using", "get",
  "can", "should", "would", "their", "there", "that", "this", "these", "those", "research", "please",
]);

// ─── crawl: SSRF-safe page fetch + text extraction ────────────────────────
// Which hosts may be crawled. Extend via CRAWL_ALLOWED_HOSTS (comma separated
// suffixes); the defaults keep the demo working out of the box.
const DEFAULT_CRAWL_HOSTS = "wikipedia.org,hackernews.ycombinator.com,news.ycombinator.com,github.com,raw.githubusercontent.com,developer.mozilla.org";
const crawlHosts = (): string[] =>
  (process.env.CRAWL_ALLOWED_HOSTS || DEFAULT_CRAWL_HOSTS)
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

function hostAllowed(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return crawlHosts().some((suffix) => host === suffix || host.endsWith("." + suffix));
}

/** Reject loopback/private/reserved addresses (IPv4, IPv6, v4-mapped). */
export function isPrivateIp(ip: string): boolean {
  const m4 = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m4) {
    const a = Number(m4[1]);
    const b = Number(m4[2]);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a === 198 && (b === 18 || b === 19)) return true;
    if (a >= 224) return true;
    return false;
  }
  const l = ip.toLowerCase();
  if (l === "::" || l === "::1") return true;
  if (l.startsWith("fc") || l.startsWith("fd")) return true; // ULA fc00::/7
  if (/^fe[89ab]/.test(l)) return true; // link-local fe80::/10
  if (l.startsWith("::ffff:")) return isPrivateIp(l.slice(7)); // v4-mapped
  if (l.startsWith("2001:db8")) return true; // documentation range
  return false;
}

/** Validate a URL before connecting; resolve DNS and check every address. */
async function assertCrawlable(u: URL): Promise<void> {
  if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error(`Blocked protocol: ${u.protocol}`);
  if (u.port && u.port !== "80" && u.port !== "443") throw new Error(`Blocked port: ${u.port}`);
  if (u.username || u.password) throw new Error("Blocked: credentials in URL");
  const host = u.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new Error(`Blocked host: ${host}`);
  }
  if (!hostAllowed(host)) throw new Error(`Blocked host: ${host} is not on the crawl allowlist (extend CRAWL_ALLOWED_HOSTS)`);

  const addrs = await dns.lookup(host, { all: true }).catch(() => null);
  if (!addrs || addrs.length === 0) throw new Error(`Cannot resolve host: ${host}`);
  for (const a of addrs) {
    if (isPrivateIp(a.address)) throw new Error(`Blocked host: ${host} resolves to a private/reserved address (${a.address})`);
  }
}

function htmlToText(html: string, maxChars: number): string {
  const stripped = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<(br|\/p|\/div|\/h[1-6]|\/li|\/tr)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  const text = stripped
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
  return text.slice(0, maxChars);
}

function extractTitle(html: string): string {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].replace(/\s+/g, " ").trim().slice(0, 140) : "";
}

export type CrawledPage = { url: string; title: string; text: string };

/** Fetch a page as text. Every hop is re-validated (DNS + allowlist + IP checks). */
export async function crawlText(
  rawUrl: string,
  opts: { timeoutMs?: number; maxChars?: number } = {}
): Promise<CrawledPage> {
  const timeoutMs = opts.timeoutMs ?? 8000;
  const maxChars = opts.maxChars ?? 2600;
  let url = new URL(rawUrl);

  for (let hop = 0; hop <= 3; hop++) {
    await assertCrawlable(url);
    const res = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
      headers: { "user-agent": "Agentmaxxing-ResearchBot/1.0 (testnet demo; +https://github.com/Boredooms/Agentmaxxing)" },
    });

    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const loc = res.headers.get("location");
      if (!loc) throw new Error("Redirect without a location header");
      url = new URL(loc, url);
      continue;
    }
    if (!res.ok) throw new Error(`${url.host} responded ${res.status}`);
    const type = res.headers.get("content-type") ?? "";
    if (!/text\/|json|xml/i.test(type)) throw new Error(`Unsupported content-type: ${type.split(";")[0]}`);

    const buf = await res.arrayBuffer();
    const html = new TextDecoder("utf-8", { fatal: false }).decode(buf.slice(0, 512 * 1024));
    return { url: url.toString(), title: extractTitle(html), text: htmlToText(html, maxChars) };
  }
  throw new Error("Too many redirects");
}
