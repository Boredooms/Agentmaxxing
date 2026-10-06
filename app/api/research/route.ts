/**
 * PAID DEEP RESEARCH — the agent's web browser.
 *
 * 0.1 USDC per research job, settled on-chain like every paid API here.
 * The pipeline: search free sources (Wikipedia + Hacker News) -> crawl the
 * top pages through the SSRF-guarded crawler -> extract readable text ->
 * return structured findings with sources. The AGENT then reasons over the
 * findings and cites them in its answer.
 */
import { paidApi, safeFetchJson } from "@/lib/x402";
import { crawlText, searchSources, type SearchHit } from "@/lib/web";

export const maxDuration = 30;

export const GET = paidApi({
  price: "0.1",
  payerLimit: 3,
  handler: async ({ url }) => {
    const q = url.searchParams.get("q")?.trim() || "";
    if (!q) throw new Error("Missing ?q=<research query>");

    // 1. gather candidates from the free search APIs
    const hits: SearchHit[] = await searchSources(safeFetchJson, q);
    if (hits.length === 0) throw new Error(`No search results for "${q}".`);

    // 2. crawl the top pages in parallel (every fetch SSRF-guarded + capped)
    const crawled = await Promise.allSettled(
      hits.slice(0, 3).map(async (hit) => ({ hit, page: await crawlText(hit.url, { timeoutMs: 8000, maxChars: 2600 }) }))
    );
    const findings = crawled
      .filter((r): r is PromiseFulfilledResult<{ hit: SearchHit; page: { url: string; title: string; text: string } }> => r.status === "fulfilled")
      .map((r) => ({
        title: r.value.page.title || r.value.hit.title,
        url: r.value.page.url,
        source: r.value.hit.source,
        excerpt: r.value.page.text,
      }));
    if (findings.length === 0) throw new Error("Found search candidates but none could be crawled. Try a different query.");

    return {
      query: q,
      searchedAt: new Date().toISOString(),
      crawledPages: findings.length,
      findings,
    };
  },
});
