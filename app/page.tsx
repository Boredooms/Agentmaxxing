import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  Check,
  CircleDollarSign,
  Download,
  FileCheck2,
  Fingerprint,
  Gauge,
  GitBranch,
  Lock,
  Radar,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { tools } from "@/agent/tools";
import { SiteHeader } from "@/components/site-header";
import { MotionProvider } from "@/components/motion-provider";
import { StoryScroll } from "@/components/story-scroll";
import { VoiceWalkthrough } from "@/components/voice-walkthrough";
import { HeroPlayground } from "@/components/hero-playground";
import { CRYPTO_DEMO_PATH, CRYPTO_TX_URL, LIVE_URL, REPO_URL, VIDEO_URL, X_URL } from "@/lib/nav";
import { VantaMark } from "@/components/brand";

export const metadata: Metadata = {
  title: "VANTA — Give it a job. Keep the receipts.",
  description:
    "VANTA plans, uses real tools, shows every step, cites evidence, and asks before spending testnet USDC. An observable autonomous work agent.",
};

const freeCount = tools.filter((t) => !t.cost).length;
const paidTools = tools.filter((t) => t.cost);

const FEATURES = [
  {
    tag: "TRACE",
    icon: Activity,
    title: "An execution trace, not a loading spinner.",
    body: "Every tool call records its arguments, returned payload, error state and measured duration. Collapsible, keyboard-accessible, and never back-filled with invented numbers.",
  },
  {
    tag: "APPROVAL",
    icon: Lock,
    title: "Approvals the server can prove.",
    body: "Paid work pauses on an opaque, single-use approval id. The client never receives the model state needed to resume. Expired, replayed and forged decisions are rejected before a tool runs.",
  },
  {
    tag: "EVIDENCE",
    icon: FileCheck2,
    title: "Evidence with real URLs.",
    body: "Research searches fixed APIs, crawls pages through an SSRF-guarded allowlist, and returns the actual page titles and URLs it read. Citations are never synthesized.",
  },
  {
    tag: "PARSERS",
    icon: Boxes,
    title: "Deterministic tools. No eval.",
    body: "Arithmetic uses a recursive-descent parser. Units use a documented table. JSON is parsed, never echoed. Summaries are extractive and label themselves as such.",
  },
  {
    tag: "BUDGET",
    icon: Gauge,
    title: "A budget guard on every run.",
    body: "A per-run testnet spending ceiling is enforced before an approval card appears, re-checked when you approve, and applied to the exact stored price.",
  },
  {
    tag: "TESTNET",
    icon: ShieldCheck,
    title: "Testnet, clearly labelled.",
    body: "Base Sepolia only. The wallet card shows the real address, balances and explorer link. No mainnet spending path exists in this build.",
  },
] as const;

const SEQUENCE = ["INTENT", "PLAN", "TOOL", "TRACE", "APPROVAL", "RESULT", "RECEIPT"];

export default function Home() {
  const ready = Boolean(process.env.GEMINI_API_KEY);
  return (
    <div className="min-h-screen">
      <MotionProvider />
      <SiteHeader />

      <main id="main">
        {/* Hero: a work order you can actually run. */}
        <section className="hero-sheet relative overflow-hidden border-b-2 border-foreground">
          <div className="paper-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden />
          <div className="pointer-events-none absolute inset-y-0 left-[8%] hidden w-px bg-signal/30 lg:block" aria-hidden />
          <div className="relative mx-auto max-w-[1440px] px-4 md:px-8">
            <div className="grid lg:grid-cols-[1.12fr_0.88fr]">
              <div className="border-foreground/25 py-12 md:py-16 lg:border-r lg:pr-12">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="stamp stamp-blue">Field manual / 001</span>
                  <span className="mono-label">An observable autonomous work agent</span>
                </div>

                <h1 className="display mt-8 text-[clamp(3.2rem,7.7vw,7.2rem)]">
                  Give it
                  <br />
                  a job.
                  <br />
                  <span className="text-primary">Keep the</span>
                  <br />
                  <span className="marker">receipts.</span>
                </h1>

                <p className="mt-7 max-w-xl text-base leading-relaxed text-foreground/75 md:text-lg">
                  VANTA plans, picks real tools, shows every input and output, cites what it read — and stops for your
                  approval before it spends a single testnet dollar.
                </p>
                <p className="mt-4 max-w-xl border-l-2 border-signal pl-4 font-mono text-[11px] leading-relaxed tracking-[0.08em] text-foreground/70 uppercase">
                  Not another chatbot. A worker with tools, receipts, and boundaries.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link
                    href="/workspace"
                    className="inline-flex items-center gap-2 bg-primary px-5 py-3 font-mono text-[11px] font-semibold tracking-[0.12em] text-primary-foreground uppercase transition-colors hover:bg-foreground"
                  >
                    Open the workspace <ArrowUpRight className="size-4" />
                  </Link>
                  <a
                    href="#playground"
                    className="inline-flex items-center gap-2 border border-foreground px-5 py-3 font-mono text-[11px] tracking-[0.12em] text-foreground uppercase transition-colors hover:bg-foreground hover:text-background"
                  >
                    Run a free mission <ArrowDownRight className="size-4" />
                  </a>
                </div>

                <dl className="mt-10 grid max-w-2xl grid-cols-2 border-t-2 border-foreground sm:grid-cols-4">
                  {[
                    { label: "Registered tools", value: String(tools.length) },
                    { label: "Free / paid", value: `${freeCount} / ${paidTools.length}` },
                    { label: "Network", value: "Base Sepolia" },
                    { label: "Run history", value: "This browser" },
                  ].map((item) => (
                    <div key={item.label} className="border-b border-foreground/25 py-3 pr-3 sm:border-r sm:px-3 sm:first:pl-0 sm:last:border-r-0">
                      <dt className="font-mono text-[9px] tracking-[0.14em] text-muted-foreground uppercase">{item.label}</dt>
                      <dd className="mt-1 font-heading text-lg font-bold tracking-tight">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="relative flex flex-col justify-center py-10 lg:py-14 lg:pl-10">
                <div className="mb-3 flex items-end justify-between gap-4">
                  <div>
                    <p className="font-mono text-[9px] tracking-[0.18em] text-muted-foreground uppercase">Work order</p>
                    <p className="font-heading text-xl font-bold tracking-tight">No. 0001 / live</p>
                  </div>
                  <div className="barcode h-7 w-24 text-foreground/70" aria-label="Decorative barcode" aria-hidden />
                </div>
                <HeroPlayground ready={ready} />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1 font-mono text-[9px] tracking-[0.12em] text-muted-foreground uppercase">
                  <span className="inline-flex items-center gap-1.5">
                    <Fingerprint className="size-3 text-signal" /> Real tool calls, not canned answers
                  </span>
                  <span>⌘/Ctrl + ↵ to run</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* A sequence band, because the content is a real sequence. */}
        <div className="overflow-hidden border-b-2 border-foreground bg-foreground py-2.5 text-background" aria-label="Execution sequence">
          <div className="ticker-track flex w-max items-center gap-6 font-mono text-[10px] tracking-[0.18em] uppercase">
            {[...SEQUENCE, ...SEQUENCE, ...SEQUENCE, ...SEQUENCE].map((item, index) => (
              <span key={`${item}-${index}`} className="flex items-center gap-6">
                {item}
                <span className="text-signal">/</span>
              </span>
            ))}
          </div>
        </div>

        {/* The problem, stated as a field note. */}
        <section className="border-b-2 border-foreground">
          <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-16 md:px-8 md:py-24 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-3">
              <div className="border-l-2 border-signal pl-4">
                <p className="mono-label">01 / The problem</p>
                <p className="mt-3 max-w-[220px] font-mono text-[11px] leading-relaxed text-muted-foreground">
                  Most agent demos are theater. The work happens off-screen, and the invoice arrives without a
                  signature.
                </p>
              </div>
            </div>
            <div className="lg:col-span-9">
              <h2 className="display-tight max-w-5xl text-4xl md:text-6xl">
                A chat box can <span className="text-primary">describe</span> work.
                <br />
                It cannot show you the <span className="marker">receipt</span>.
              </h2>
              <div className="mt-10 grid gap-6 border-t-2 border-foreground pt-6 md:grid-cols-3">
                {[
                  {
                    label: "01 / Operate",
                    title: "Real tools, not promises.",
                    body: "Calculations, units, JSON, summaries, search, crawls and testnet payments. A tool runs or it fails; the trace says which.",
                  },
                  {
                    label: "02 / Inspect",
                    title: "The evidence is visible.",
                    body: "Arguments, payloads, errors, durations and source URLs are returned by the same loop that did the work.",
                  },
                  {
                    label: "03 / Bound",
                    title: "The money has a gate.",
                    body: "Paid capability is classified before the model sees a toolbox, then held for a server-verified human approval.",
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="font-mono text-[9px] tracking-[0.16em] text-signal uppercase">{item.label}</p>
                    <h3 className="mt-2 font-heading text-xl font-bold tracking-tight">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <StoryScroll />

        {/* Real artifacts, shown as printed evidence rather than product renders. */}
        <section className="border-b-2 border-foreground bg-[#e7dfd1]" aria-labelledby="proof-heading">
          <div className="mx-auto max-w-[1440px] px-4 py-16 md:px-8 md:py-24">
            <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-8">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="mono-label">Proof / captured</p>
                  <span className="stamp">Real run</span>
                </div>
                <h2 id="proof-heading" className="display mt-4 text-4xl md:text-6xl">
                  This is the
                  <br />
                  <span className="text-primary">actual run.</span>
                </h2>
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground lg:col-span-4">
                Captured from the same app at 2×. The approval is a real pending paid run; the sources are the titles
                and URLs the crawler actually returned. Nothing is a product render.
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-12">
              <figure className="border-2 border-foreground bg-card p-2 shadow-[10px_10px_0_rgba(20,22,26,0.12)] lg:col-span-8 lg:-rotate-1">
                <div className="flex items-center justify-between gap-3 border-b border-foreground/20 px-1.5 py-1.5">
                  <span className="flex items-center gap-2 font-mono text-[9px] tracking-[0.14em] uppercase">
                    <Lock className="size-3 text-signal" /> Payment approval
                  </span>
                  <span className="font-mono text-[8px] tracking-[0.12em] text-muted-foreground uppercase">
                    05 / held before execution
                  </span>
                </div>
                <img
                  src="/demo/05b-approval-card.png"
                  alt="VANTA payment approval card showing the exact tool, price and Base Sepolia network"
                  width={1796}
                  height={694}
                  loading="lazy"
                  className="mt-2 block h-auto w-full border border-foreground/15"
                />
                <figcaption className="flex flex-wrap items-center justify-between gap-2 px-1.5 pt-2 font-mono text-[9px] tracking-[0.1em] text-muted-foreground uppercase">
                  <span>Single-use · 5 minute expiry</span>
                  <span className="text-signal">Nothing runs until you decide</span>
                </figcaption>
              </figure>

              <aside className="flex flex-col border-2 border-foreground bg-card p-5 lg:col-span-4">
                <p className="mono-label flex items-center gap-2">
                  <ShieldCheck className="size-3.5 text-primary" /> What this proves
                </p>
                <h3 className="mt-3 font-heading text-2xl leading-tight font-bold tracking-tight">
                  The gate is server-side, not a UI trick.
                </h3>
                <ul className="mt-4 flex flex-col gap-3 text-xs leading-relaxed text-foreground/75">
                  <li className="border-b border-foreground/20 pb-3">
                    The approval id is opaque, single-use and expires in five minutes.
                  </li>
                  <li className="border-b border-foreground/20 pb-3">
                    Approving re-validates the tool, arguments, price, intent and run budget.
                  </li>
                  <li className="border-b border-foreground/20 pb-3">
                    Denial never invokes the paid tool — it cannot produce a receipt.
                  </li>
                  <li>One paid approval per run. No mainnet path exists.</li>
                </ul>
                <Link
                  href="/workspace"
                  className="mt-auto inline-flex items-center gap-2 border-t-2 border-foreground pt-4 font-mono text-[9px] tracking-[0.12em] uppercase hover:text-primary"
                >
                  Inspect the boundary <ArrowUpRight className="size-3.5" />
                </Link>
              </aside>

              <figure className="border-2 border-foreground bg-card p-2 shadow-[8px_8px_0_rgba(20,22,26,0.1)] lg:col-span-7 lg:rotate-1">
                <div className="flex items-center justify-between gap-3 border-b border-foreground/20 px-1.5 py-1.5">
                  <span className="flex items-center gap-2 font-mono text-[9px] tracking-[0.14em] uppercase">
                    <Activity className="size-3 text-signal" /> Measured trace
                  </span>
                  <span className="font-mono text-[8px] text-muted-foreground uppercase">ms / real</span>
                </div>
                <img
                  src="/demo/04c-trace-card.png"
                  alt="VANTA execution trace with real tool arguments, outputs and measured duration"
                  width={1796}
                  height={332}
                  loading="lazy"
                  className="mt-2 block h-auto w-full border border-foreground/15"
                />
                <figcaption className="px-1.5 pt-2 font-mono text-[9px] tracking-[0.1em] text-muted-foreground uppercase">
                  Inputs, outputs, errors, duration
                </figcaption>
              </figure>

              <figure className="border-2 border-foreground bg-card p-2 shadow-[8px_8px_0_rgba(20,22,26,0.1)] lg:col-span-5 lg:-rotate-1">
                <div className="flex items-center justify-between gap-3 border-b border-foreground/20 px-1.5 py-1.5">
                  <span className="flex items-center gap-2 font-mono text-[9px] tracking-[0.14em] uppercase">
                    <FileCheck2 className="size-3 text-signal" /> Evidence
                  </span>
                  <span className="font-mono text-[8px] text-muted-foreground uppercase">crawled / cited</span>
                </div>
                <img
                  src="/demo/06c-sources-card.png"
                  alt="VANTA sources panel listing the real pages returned by a research run"
                  width={1796}
                  height={470}
                  loading="lazy"
                  className="mt-2 block h-auto w-full border border-foreground/15"
                />
                <figcaption className="px-1.5 pt-2 font-mono text-[9px] tracking-[0.1em] text-muted-foreground uppercase">
                  Actual titles. Actual URLs. No invention.
                </figcaption>
              </figure>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href={VIDEO_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-foreground px-4 py-3 font-mono text-[10px] tracking-[0.12em] text-background uppercase transition-colors hover:bg-primary"
              >
                Watch the 64s film <ArrowUpRight className="size-3.5" />
              </a>
              <Link
                href="/brand"
                className="inline-flex items-center gap-2 border border-foreground px-4 py-3 font-mono text-[10px] tracking-[0.12em] uppercase transition-colors hover:bg-foreground hover:text-background"
              >
                Download the brand kit <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* The Week 3 crypto proof, with the real receipt rather than a promise. */}
        <section className="border-b-2 border-foreground bg-foreground text-background" aria-labelledby="chain-heading">
          <div className="mx-auto max-w-[1440px] px-4 py-16 md:px-8 md:py-24">
            <div className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-16">
              <div className="lg:col-span-5">
                <p className="font-mono text-[10px] tracking-[0.18em] text-[#ff8a66] uppercase">Week 3 / x402</p>
                <h2 id="chain-heading" className="display mt-4 text-4xl md:text-6xl">
                  The receipt is
                  <br />
                  <span className="text-[#ff8a66]">on-chain.</span>
                </h2>
                <p className="mt-5 max-w-md text-sm leading-relaxed text-background/70">
                  A real weather call paid <strong className="font-semibold text-background">0.01 USDC</strong> on Base
                  Sepolia. The wallet dropped from 18.87 to 18.86; the transaction succeeded and the trace kept the hash.
                  No mainnet path exists.
                </p>

                <dl className="mt-8 grid grid-cols-3 border-t border-background/25">
                  {[
                    { label: "Settled", value: "0.01 USDC" },
                    { label: "Block", value: "49,311,297" },
                    { label: "Status", value: "0x1" },
                  ].map((item) => (
                    <div key={item.label} className="border-b border-background/25 py-3 pr-3">
                      <dt className="font-mono text-[8px] tracking-[0.14em] text-background/50 uppercase">{item.label}</dt>
                      <dd className="mt-1 font-mono text-sm text-background">{item.value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-7 flex flex-wrap gap-3">
                  <a
                    href={CRYPTO_DEMO_PATH}
                    download
                    className="inline-flex items-center gap-2 bg-[#f7f3ea] px-4 py-3 font-mono text-[10px] font-semibold tracking-[0.12em] text-foreground uppercase transition-colors hover:bg-[#ff8a66] hover:text-[#14161a]"
                  >
                    <Download className="size-3.5" /> Download crypto demo
                  </a>
                  <a
                    href={CRYPTO_TX_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 border border-background/45 px-4 py-3 font-mono text-[10px] tracking-[0.12em] text-background uppercase transition-colors hover:border-background"
                  >
                    View transaction <ArrowUpRight className="size-3.5" />
                  </a>
                </div>
                <p className="mt-4 font-mono text-[9px] tracking-[0.12em] text-background/45 uppercase">
                  57.88s · 1920×1080 · testnet only
                </p>
              </div>

              <div className="lg:col-span-7">
                <div className="receipt max-w-2xl text-foreground lg:ml-auto">
                  <div className="receipt-edge" aria-hidden />
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-foreground px-5 py-3">
                    <div>
                      <p className="font-heading text-lg font-extrabold tracking-[0.12em] uppercase">VANTA</p>
                      <p className="font-mono text-[9px] tracking-[0.14em] text-muted-foreground uppercase">
                        Settlement receipt / Base Sepolia
                      </p>
                    </div>
                    <span className="stamp">Testnet</span>
                  </div>
                  <div className="px-5 py-4">
                    <p className="mono-label">Status / confirmed</p>
                    <p className="mt-1 font-heading text-4xl font-extrabold tracking-tight md:text-5xl">
                      Settled <span className="text-primary">0.01 USDC</span>
                    </p>
                    <dl className="mt-5 divide-y divide-foreground/25 border-y border-foreground/25 font-mono text-[10px]">
                      {[
                        { label: "Tx hash", value: "0x9b376282…52f9", href: CRYPTO_TX_URL },
                        { label: "Block", value: "49,311,297", href: null },
                        { label: "Status", value: "0x1 · success", href: null },
                        { label: "Wallet", value: "0xDa83…bAfe", href: null },
                        { label: "Network", value: "Base Sepolia · testnet", href: null },
                      ].map((row) => (
                        <div key={row.label} className="flex items-center justify-between gap-4 py-2.5">
                          <dt className="text-muted-foreground uppercase">{row.label}</dt>
                          <dd className="text-right text-foreground">
                            {row.href ? (
                              <a href={row.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-primary">
                                {row.value} <ArrowUpRight className="size-2.5" />
                              </a>
                            ) : (
                              row.value
                            )}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <div className="mt-4 flex items-center justify-between gap-4">
                      <span className="font-mono text-[9px] tracking-[0.12em] text-signal uppercase">
                        Human approval / single use
                      </span>
                      <div className="barcode h-7 w-32 text-foreground/70" aria-hidden />
                    </div>
                  </div>
                  <div className="receipt-edge" aria-hidden />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Guarantees as a field-notes table, not six identical cards. */}
        <section className="border-b-2 border-foreground" aria-labelledby="features-heading">
          <div className="mx-auto max-w-[1440px] px-4 py-16 md:px-8 md:py-24">
            <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-8">
                <p className="mono-label">03 / Field notes</p>
                <h2 id="features-heading" className="display mt-4 text-4xl md:text-6xl">
                  The receipts are
                  <br />
                  <span className="text-primary">the product.</span>
                </h2>
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground lg:col-span-4">
                Every claim below is implemented in this repository and exercised by the app — not a roadmap slide.
              </p>
            </div>

            <div className="mt-12 border-y-2 border-foreground">
              {FEATURES.map(({ tag, icon: Icon, title, body }) => (
                <article
                  key={tag}
                  data-reveal
                  className="grid gap-3 border-b border-foreground/25 py-6 last:border-b-0 md:grid-cols-[120px_1fr_1.25fr] md:gap-8"
                >
                  <div className="flex items-center gap-2 md:items-start">
                    <Icon className="size-3.5 shrink-0 text-signal" strokeWidth={1.8} />
                    <span className="font-mono text-[9px] tracking-[0.16em] text-signal uppercase">{tag}</span>
                  </div>
                  <h3 className="font-heading text-xl leading-tight font-bold tracking-tight md:text-2xl">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Optional voice, presented as an annotation. */}
        <section className="border-b-2 border-foreground bg-[#e7dfd1]">
          <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-16 md:px-8 md:py-20 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="mono-label">04 / Accessibility</p>
              <h2 className="display-tight mt-4 text-4xl md:text-5xl">
                Prefer to
                <br />
                <span className="text-primary">listen?</span>
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
                A browser-voice walkthrough of the execution sequence. Optional, never autoplaying, with a full
                transcript. Core functionality is identical with sound off.
              </p>
            </div>
            <div className="lg:col-span-8" data-reveal>
              <VoiceWalkthrough />
            </div>
          </div>
        </section>

        {/* The price list is an actual receipt. */}
        <section id="pricing" className="border-b-2 border-foreground" aria-labelledby="pricing-heading">
          <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-16 md:px-8 md:py-24 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="mono-label">05 / The bill</p>
              <h2 id="pricing-heading" className="display mt-4 text-4xl md:text-6xl">
                Free by default.
                <br />
                <span className="text-primary">Paid on purpose.</span>
              </h2>
              <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
                Free tools cover search, computation, formatting, summaries and wallet reads. Paid tools are explicit,
                priced per call, and never run without a decision. All amounts in this build are testnet USDC.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/tools"
                  className="inline-flex items-center gap-2 border border-foreground px-4 py-2.5 font-mono text-[10px] tracking-[0.12em] uppercase transition-colors hover:bg-foreground hover:text-background"
                >
                  Browse all {tools.length} tools <ArrowUpRight className="size-3.5" />
                </Link>
                <Link
                  href="/activity"
                  className="inline-flex items-center gap-2 border border-foreground/40 px-4 py-2.5 font-mono text-[10px] tracking-[0.12em] uppercase text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                >
                  See the ledger
                </Link>
              </div>
              <p className="mt-8 max-w-md border-l-2 border-signal pl-4 font-mono text-[10px] leading-relaxed tracking-[0.08em] text-muted-foreground uppercase">
                One paid approval per run. Ceiling enforced server-side. No mainnet path exists.
              </p>
            </div>

            <div className="receipt max-w-xl lg:justify-self-end" data-reveal>
              <div className="receipt-edge" aria-hidden />
              <div className="flex items-center justify-between border-b-2 border-foreground px-5 py-3">
                <div>
                  <p className="font-heading text-lg font-extrabold tracking-[0.12em] uppercase">VANTA</p>
                  <p className="font-mono text-[9px] tracking-[0.14em] text-muted-foreground uppercase">
                    Price list / testnet
                  </p>
                </div>
                <div className="barcode h-8 w-20 text-foreground/70" aria-hidden />
              </div>
              <div className="px-5 py-4 font-mono text-[10px] tracking-[0.1em] text-muted-foreground uppercase">
                <div className="flex justify-between border-b border-dotted border-foreground/40 pb-2">
                  <span>Item</span>
                  <span>Per call</span>
                </div>
                {paidTools.map((tool) => (
                  <div key={tool.name} className="flex items-end gap-2 py-3">
                    <div className="min-w-0">
                      <p className="text-[11px] text-foreground">{tool.name}</p>
                      <p className="mt-0.5 text-[9px] tracking-normal normal-case text-muted-foreground">
                        {tool.name === "get_weather"
                          ? "Live conditions, settled on-chain."
                          : tool.name === "get_fortune"
                            ? "A testnet fortune reading."
                            : "Search, crawl and cite real pages."}
                      </p>
                    </div>
                    <span className="mb-1 flex-1 border-b border-dotted border-foreground/40" aria-hidden />
                    <span className="text-[11px] text-primary">{tool.cost}</span>
                  </div>
                ))}
                <div className="mt-2 flex justify-between border-t-2 border-foreground pt-3 text-foreground">
                  <span>Free tools</span>
                  <span>{freeCount} included</span>
                </div>
                <div className="mt-2 flex justify-between text-foreground">
                  <span>Approval</span>
                  <span className="text-signal">required each time</span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-foreground/30 px-5 py-3">
                <span className="stamp">Testnet only</span>
                <span className="font-mono text-[9px] tracking-[0.12em] text-muted-foreground uppercase">
                  Base Sepolia · USDC
                </span>
              </div>
              <div className="receipt-edge" aria-hidden />
            </div>
          </div>
        </section>

        {/* The boundary, as a contract. */}
        <section className="border-b-2 border-foreground" aria-labelledby="boundary-heading">
          <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-16 md:px-8 md:py-24 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <p className="mono-label">06 / The boundary</p>
              <h2 id="boundary-heading" className="display mt-4 text-4xl md:text-6xl">
                Money is a<br />
                <span className="text-primary">decision.</span>
                <br />
                Not a side effect.
              </h2>
              <div className="mt-8 inline-flex -rotate-2 border-2 border-signal px-4 py-2.5 font-mono text-[11px] font-semibold tracking-[0.16em] text-signal uppercase">
                Human signature required
              </div>
            </div>
            <div className="lg:col-span-7">
              <dl className="border-t-2 border-foreground">
                {[
                  {
                    key: "Approval token",
                    value: "Opaque, server-issued, single-use. Five-minute expiry. The browser never holds the resumable state.",
                  },
                  {
                    key: "On approval",
                    value: "Tool name, arguments, current price, original intent and remaining budget are re-validated before the call.",
                  },
                  {
                    key: "On denial",
                    value: "The paid tool is never invoked. The agent receives a structured denial and finishes with free work only.",
                  },
                  {
                    key: "On settlement",
                    value: "Testnet USDC on Base Sepolia. No mainnet path. Receipts link to the explorer when a real transaction exists.",
                  },
                ].map((row) => (
                  <div key={row.key} className="grid gap-2 border-b border-foreground/25 py-5 md:grid-cols-[180px_1fr] md:gap-8">
                    <dt className="font-mono text-[9px] tracking-[0.16em] text-signal uppercase">{row.key}</dt>
                    <dd className="text-sm leading-relaxed text-foreground/80">{row.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-5 font-mono text-[9px] leading-relaxed tracking-[0.1em] text-muted-foreground uppercase">
                This is a public demo with no authentication. Do not connect a funded wallet.
              </p>
            </div>
          </div>
        </section>

        {/* Open work, not a roadmap of promises. */}
        <section className="border-b-2 border-foreground" aria-labelledby="roadmap-heading">
          <div className="mx-auto max-w-[1440px] px-4 py-16 md:px-8 md:py-24">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="mono-label">07 / Open work</p>
                <h2 id="roadmap-heading" className="display-tight mt-4 text-4xl md:text-5xl">
                  Honest about the edge.
                </h2>
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                These are not implemented yet. They are the next engineering problems, not marketing promises.
              </p>
            </div>
            <div className="mt-10 border-t-2 border-foreground">
              {[
                { icon: GitBranch, tag: "Week 2", title: "Shared approval store", body: "Move pending approvals from in-memory to a durable, instance-shared store with signed consumption receipts.", status: "Not built" },
                { icon: CircleDollarSign, tag: "Week 2", title: "Spend policies", body: "Per-tool daily caps, allowlisted recipients and automatic expiry, enforced server-side.", status: "Not built" },
                { icon: Boxes, tag: "Week 3", title: "Agent-to-agent x402", body: "Let VANTA buy a result from another agent’s paid endpoint, with the same approval boundary.", status: "Not built" },
                { icon: Fingerprint, tag: "Week 3", title: "ZK spend attestations", body: "Prove a run stayed inside budget without revealing the full audit trail.", status: "Not built" },
              ].map(({ icon: Icon, tag, title, body, status }) => (
                <article key={title} className="grid gap-3 border-b border-foreground/25 py-5 md:grid-cols-[90px_34px_1fr_1.2fr_90px] md:items-start md:gap-6">
                  <span className="font-mono text-[9px] tracking-[0.14em] text-muted-foreground uppercase">{tag}</span>
                  <Icon className="size-4 text-foreground/60" strokeWidth={1.7} />
                  <h3 className="font-heading text-lg font-bold tracking-tight">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
                  <span className="font-mono text-[9px] tracking-[0.12em] text-signal uppercase md:text-right">{status}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Close with the promise, plainly. */}
        <section className="border-b-2 border-foreground bg-primary text-primary-foreground">
          <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-16 md:px-8 md:py-24 lg:grid-cols-[1.4fr_0.6fr] lg:items-end">
            <div>
              <p className="font-mono text-[10px] tracking-[0.18em] text-primary-foreground/65 uppercase">Ready when you are</p>
              <h2 className="display mt-4 text-5xl md:text-7xl">
                Give it a job.
                <br />
                Keep the keys.
              </h2>
            </div>
            <div className="flex flex-col gap-3">
              <Link
                href="/workspace"
                className="inline-flex items-center justify-between gap-4 bg-[#f7f3ea] px-5 py-4 font-mono text-[11px] font-bold tracking-[0.12em] text-foreground uppercase transition-colors hover:bg-signal hover:text-white"
              >
                Start a mission <ArrowUpRight className="size-4" />
              </Link>
              <a
                href={REPO_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-between gap-4 border border-primary-foreground/50 px-5 py-4 font-mono text-[11px] tracking-[0.12em] text-primary-foreground uppercase transition-colors hover:border-primary-foreground"
              >
                Read the source <ArrowUpRight className="size-4" />
              </a>
              <div className="mt-4 flex items-center justify-between border-t border-primary-foreground/25 pt-3">
                <span className="font-mono text-[9px] tracking-[0.14em] text-primary-foreground/65 uppercase">Field manual / end</span>
                <div className="barcode h-5 w-24 text-primary-foreground/60" aria-hidden />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-[1440px] px-4 py-12 md:px-8">
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          <div className="max-w-sm">
            <div className="flex items-center gap-3">
              <VantaMark className="size-7" />
              <span className="font-heading text-sm font-extrabold tracking-[0.18em] uppercase">Vanta</span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              An observable autonomous work agent. Built on the agentmaxxin starter for the Agentmaxxing × Rise In Week 1
              challenge. VANTA is a working product name; its legal/domain availability has not been verified.
            </p>
            <div className="barcode mt-5 h-6 w-full text-foreground/40" aria-hidden />
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <p className="mono-label mb-3">Product</p>
              <ul className="flex flex-col gap-2 text-xs text-muted-foreground">
                <li><Link href="/workspace" className="hover:text-foreground">Workspace</Link></li>
                <li><Link href="/tools" className="hover:text-foreground">Tools</Link></li>
                <li><Link href="/activity" className="hover:text-foreground">Activity</Link></li>
                <li><Link href="/settings" className="hover:text-foreground">Settings</Link></li>
              </ul>
            </div>
            <div>
              <p className="mono-label mb-3">Code</p>
              <ul className="flex flex-col gap-2 text-xs text-muted-foreground">
                <li><a href={REPO_URL} target="_blank" rel="noreferrer" className="hover:text-foreground">GitHub</a></li>
                <li><a href={VIDEO_URL} target="_blank" rel="noreferrer" className="hover:text-foreground">Watch the film</a></li>
                <li><Link href="/brand" className="hover:text-foreground">Brand assets</Link></li>
                <li><a href={LIVE_URL} target="_blank" rel="noreferrer" className="hover:text-foreground">Live deployment</a></li>
                <li><a href={X_URL} target="_blank" rel="noreferrer" className="hover:text-foreground">X / @nightproof67</a></li>
              </ul>
            </div>
            <div>
              <p className="mono-label mb-3">Status</p>
              <ul className="flex flex-col gap-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-1.5"><Check className="size-3 text-primary" /> Base Sepolia testnet</li>
                <li className="flex items-center gap-1.5"><Check className="size-3 text-primary" /> Human approvals</li>
                <li className="flex items-center gap-1.5"><Check className="size-3 text-primary" /> Local run history</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t-2 border-foreground pt-4 font-mono text-[9px] tracking-[0.14em] uppercase text-muted-foreground">
          <span>© {new Date().getFullYear()} VANTA demo · no financial advice</span>
          <span className="flex items-center gap-2"><Wallet className="size-3" /> Testnet only · nothing here is a real-money transaction</span>
          <span className="flex items-center gap-1.5"><Radar className="size-3" /> Built for inspection</span>
        </div>
      </footer>
    </div>
  );
}
