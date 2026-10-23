import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  Download,
  FileArchive,
  Fingerprint,
  Image as ImageIcon,
  Lock,
  Palette,
  Type,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { VantaMark } from "@/components/brand";
import { REPO_URL } from "@/lib/nav";

export const metadata: Metadata = {
  title: "Brand & press kit",
  description:
    "Download the VANTA mark, wordmark, X profile picture, X banner, social card and product screenshots. Bone paper, ink rules, cobalt authorization, safety-orange stamps.",
  openGraph: {
    title: "VANTA — Brand & press kit",
    description: "The field manual, in files. Logo, X assets, social card and product screenshots.",
    images: ["/brand/vanta-og.png"],
  },
};

const PALETTE = [
  { name: "Bone paper", hex: "#EDE7DB", ink: "#14161A", note: "Default field" },
  { name: "Cream stock", hex: "#F7F3EA", ink: "#14161A", note: "Receipts / cards" },
  { name: "Ink", hex: "#14161A", ink: "#F7F3EA", note: "Rules / type" },
  { name: "Cobalt", hex: "#1B2BE0", ink: "#F7F3EA", note: "Authorization" },
  { name: "Signal", hex: "#FF4D12", ink: "#14161A", note: "Stamps / attention" },
  { name: "Muted ink", hex: "#6A6459", ink: "#F7F3EA", note: "Metadata" },
];

const X_ASSETS = [
  {
    name: "X profile picture",
    file: "vanta-x-pfp.png",
    hi: "vanta-x-pfp@2x.png",
    size: "400 × 400",
    note: "Square, high contrast, legible below 32 px. Upload the 400 px file; keep the @2x master for print.",
    image: "/brand/vanta-x-pfp.png",
    wide: false,
  },
  {
    name: "X header",
    file: "vanta-x-banner.png",
    hi: "vanta-x-banner@2x.png",
    size: "1500 × 500",
    note: "The lockup, promise and a real approval receipt. Key type sits above X's lower-left avatar crop.",
    image: "/brand/vanta-x-banner.png",
    wide: true,
  },
  {
    name: "Social card",
    file: "vanta-og.png",
    hi: "vanta-og@2x.png",
    size: "1200 × 630",
    note: "Use for link previews, launch posts and submission cards. Readable at timeline width.",
    image: "/brand/vanta-og.png",
    wide: true,
  },
];

const LOGOS = [
  {
    name: "Horizontal logo",
    file: "vanta-logo.svg",
    size: "SVG / 420 × 96",
    note: "Preferred lockup for light fields and documents.",
  },
  {
    name: "Mark",
    file: "vanta-mark.svg",
    size: "SVG / 64 × 64",
    note: "Cobalt field, cream V, orange authorization tab.",
  },
];

export default function BrandPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main id="main">
        <section className="hero-sheet relative overflow-hidden border-b-2 border-foreground">
          <div className="paper-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden />
          <div className="relative mx-auto max-w-[1440px] px-4 py-12 md:px-8 md:py-16">
            <div className="flex flex-wrap items-center gap-3">
              <span className="stamp stamp-blue">Brand / field manual</span>
              <span className="mono-label">Logos, X assets, social card, product proof</span>
            </div>

            <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-7">
                <h1 className="display text-[clamp(3rem,7vw,6.2rem)]">
                  The field
                  <br />
                  manual, <span className="text-primary">in files.</span>
                </h1>
                <p className="mt-6 max-w-xl text-base leading-relaxed text-foreground/75 md:text-lg">
                  One coherent kit for VANTA: a Cobalt-and-bone mark, a banner that states the promise, and the
                  receipt language that makes the product legible. No gradients, no stock imagery, no generic robot.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <a
                    href="/brand/vanta-brand-kit.zip"
                    download
                    className="inline-flex items-center gap-2 bg-primary px-5 py-3 font-mono text-[10px] font-semibold tracking-[0.12em] text-primary-foreground uppercase transition-colors hover:bg-foreground"
                  >
                    <FileArchive className="size-4" /> Download full kit
                  </a>
                  <Link
                    href="/workspace"
                    className="inline-flex items-center gap-2 border border-foreground px-5 py-3 font-mono text-[10px] tracking-[0.12em] uppercase transition-colors hover:bg-foreground hover:text-background"
                  >
                    Open the product <ArrowUpRight className="size-4" />
                  </Link>
                </div>
                <p className="mt-4 font-mono text-[9px] leading-relaxed tracking-[0.12em] text-muted-foreground uppercase">
                  SVG + PNG · 1× and 2× masters · usage notes included
                </p>
              </div>

              <div className="lg:col-span-5">
                <div className="border-2 border-foreground bg-card p-2 shadow-[10px_10px_0_rgba(20,22,26,0.14)]">
                  <img
                    src="/brand/vanta-x-banner.png"
                    alt="VANTA X header: Give it a job. Keep the receipts, beside a payment approval receipt."
                    width={1500}
                    height={500}
                    className="block h-auto w-full border border-foreground/20"
                  />
                  <div className="flex items-center justify-between gap-3 px-1 pt-2 font-mono text-[9px] tracking-[0.12em] uppercase">
                    <span className="text-muted-foreground">X header / 1500 × 500</span>
                    <span className="inline-flex items-center gap-1 text-signal">
                      <Fingerprint className="size-3" /> Ready to upload
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b-2 border-foreground" aria-labelledby="x-heading">
          <div className="mx-auto max-w-[1440px] px-4 py-16 md:px-8 md:py-24">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="mono-label">01 / Social</p>
                <h2 id="x-heading" className="display-tight mt-4 text-4xl md:text-5xl">
                  Ready for X, in two files.
                </h2>
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                Download, upload, done. The avatar is intentionally spare so it survives the timeline crop; the banner
                carries the product promise.
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-12">
              {X_ASSETS.map((asset, index) => (
                <figure
                  key={asset.file}
                  className={`border-2 border-foreground bg-card p-3 ${
                    asset.wide ? "lg:col-span-8" : "lg:col-span-4"
                  } ${index === 0 ? "lg:self-start" : ""}`}
                >
                  <div className={asset.wide ? "border border-foreground/20" : "grid place-items-center border border-foreground/20 bg-[#e7dfd1] p-5"}>
                    <img
                      src={asset.image}
                      alt={`${asset.name} — ${asset.size}`}
                      width={asset.wide ? 1500 : 400}
                      height={asset.wide ? 500 : 400}
                      loading="lazy"
                      className={
                        asset.wide
                          ? "block h-auto w-full"
                          : "block size-40 border-2 border-foreground object-cover shadow-[7px_7px_0_rgba(20,22,26,0.16)] sm:size-48"
                      }
                    />
                  </div>
                  <figcaption className="mt-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-heading text-lg font-bold tracking-tight">{asset.name}</p>
                        <p className="mt-0.5 font-mono text-[9px] tracking-[0.14em] text-muted-foreground uppercase">
                          {asset.size}
                        </p>
                      </div>
                      <span className="border border-foreground/30 px-2 py-1 font-mono text-[8px] tracking-[0.12em] text-muted-foreground uppercase">
                        {index === 0 ? "PNG" : "PNG / 2× master"}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{asset.note}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a
                        href={`/brand/${asset.file}`}
                        download
                        className="inline-flex items-center gap-1.5 border border-foreground px-2.5 py-1.5 font-mono text-[9px] tracking-wider uppercase transition-colors hover:bg-foreground hover:text-background"
                      >
                        <Download className="size-3" /> Download PNG
                      </a>
                      <a
                        href={`/brand/${asset.hi}`}
                        download
                        className="inline-flex items-center gap-1.5 border border-foreground/30 px-2.5 py-1.5 font-mono text-[9px] tracking-wider uppercase text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                      >
                        @2x master
                      </a>
                    </div>
                  </figcaption>
                </figure>
              ))}

              <aside className="flex flex-col border-2 border-foreground bg-[#e7dfd1] p-5 lg:col-span-4">
                <p className="mono-label">Upload order</p>
                <h3 className="mt-3 font-heading text-2xl leading-tight font-bold tracking-tight">
                  Three files. Two minutes.
                </h3>
                <ol className="mt-4 flex flex-col gap-3 text-xs leading-relaxed text-foreground/75">
                  <li className="flex gap-3 border-b border-foreground/20 pb-3">
                    <span className="font-mono text-[9px] tracking-wider text-signal">01</span>
                    <span>Upload the 400 px profile. Keep it square; X applies the circle.</span>
                  </li>
                  <li className="flex gap-3 border-b border-foreground/20 pb-3">
                    <span className="font-mono text-[9px] tracking-wider text-signal">02</span>
                    <span>Upload the 1500 × 500 header. The receipt sits on the right.</span>
                  </li>
                  <li className="flex gap-3 border-b border-foreground/20 pb-3">
                    <span className="font-mono text-[9px] tracking-wider text-signal">03</span>
                    <span>Use the 1200 × 630 card for launch posts and link previews.</span>
                  </li>
                </ol>
                <p className="mt-4 font-mono text-[9px] leading-relaxed tracking-[0.1em] text-muted-foreground uppercase">
                  Keep the wordmark, V and orange tab intact. Do not crop the receipt.
                </p>
                <a
                  href="/brand/vanta-brand-kit.zip"
                  download
                  className="mt-5 inline-flex items-center justify-center gap-2 bg-foreground px-4 py-3 font-mono text-[10px] tracking-[0.12em] text-background uppercase transition-colors hover:bg-primary"
                >
                  <Download className="size-3.5" /> Download all files
                </a>
              </aside>
            </div>
          </div>
        </section>

        <section className="border-b-2 border-foreground" aria-labelledby="logo-heading">
          <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-16 md:px-8 md:py-24 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="mono-label">02 / Marks</p>
              <h2 id="logo-heading" className="display-tight mt-4 text-4xl md:text-5xl">
                One V.
                <br />
                A receipt edge.
              </h2>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
                The mark is a cream V on cobalt with an orange tab in the corner and a short baseline: the agent, the
                authorization, the record. Keep it square, keep it flat, and never redraw the V as a gradient.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <div className="border-2 border-foreground bg-card p-4">
                  <VantaMark className="size-20" />
                </div>
                <div className="border border-foreground/30 bg-card px-5 py-4">
                  <img src="/brand/vanta-logo.svg" alt="VANTA horizontal logo" width={260} height={59} className="h-auto w-[240px]" />
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="border-t-2 border-foreground">
                {LOGOS.map((logo) => (
                  <div
                    key={logo.file}
                    className="grid gap-3 border-b border-foreground/25 py-5 md:grid-cols-[1fr_auto] md:items-center"
                  >
                    <div>
                      <p className="font-heading text-xl font-bold tracking-tight">{logo.name}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{logo.note}</p>
                      <p className="mt-1 font-mono text-[9px] tracking-[0.12em] text-muted-foreground uppercase">
                        {logo.size}
                      </p>
                    </div>
                    <a
                      href={`/brand/${logo.file}`}
                      download
                      className="inline-flex w-fit items-center gap-1.5 border border-foreground px-3 py-2 font-mono text-[9px] tracking-wider uppercase transition-colors hover:bg-foreground hover:text-background"
                    >
                      <Download className="size-3" /> Download SVG
                    </a>
                  </div>
                ))}
                <a
                  href="/brand/vanta-brand-kit.zip"
                  download
                  className="mt-5 inline-flex items-center gap-2 bg-foreground px-4 py-3 font-mono text-[10px] tracking-[0.12em] text-background uppercase transition-colors hover:bg-primary"
                >
                  <FileArchive className="size-4" /> All marks + social assets
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b-2 border-foreground bg-[#e7dfd1]" aria-labelledby="system-heading">
          <div className="mx-auto max-w-[1440px] px-4 py-16 md:px-8 md:py-24">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="mono-label">03 / System</p>
                <h2 id="system-heading" className="display-tight mt-4 text-4xl md:text-5xl">
                  A field manual,
                  <br />
                  not a brand deck.
                </h2>
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                Paper, ink, authorization cobalt and signal orange. Type does the heavy lifting; the receipt is the
                recurring object.
              </p>
            </div>

            <div className="mt-10 grid gap-10 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <p className="flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] uppercase">
                  <Palette className="size-3.5 text-signal" /> Palette
                </p>
                <div className="mt-4 grid gap-0 border border-foreground sm:grid-cols-2">
                  {PALETTE.map((color) => (
                    <div key={color.name} className="flex items-stretch border-b border-foreground last:border-b-0 sm:odd:border-r">
                      <span
                        className="w-20 shrink-0 border-r border-foreground"
                        style={{ backgroundColor: color.hex, color: color.ink }}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1 px-3 py-3">
                        <p className="text-xs font-semibold">{color.name}</p>
                        <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{color.hex}</p>
                        <p className="mt-1 font-mono text-[8px] tracking-[0.1em] uppercase text-muted-foreground">
                          {color.note}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5">
                <p className="flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] uppercase">
                  <Type className="size-3.5 text-signal" /> Type
                </p>
                <div className="mt-4 divide-y divide-foreground/25 border border-foreground bg-card">
                  <div className="p-4">
                    <p className="font-mono text-[8px] tracking-[0.14em] text-muted-foreground uppercase">
                      Display / Bricolage Grotesque 800
                    </p>
                    <p className="display-tight mt-2 text-4xl">Give it a job.</p>
                  </div>
                  <div className="p-4">
                    <p className="font-mono text-[8px] tracking-[0.14em] text-muted-foreground uppercase">
                      Body / Public Sans 400–600
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/80">
                      Every input, every output, every source — then a decision before money moves.
                    </p>
                  </div>
                  <div className="p-4">
                    <p className="font-mono text-[8px] tracking-[0.14em] text-muted-foreground uppercase">
                      Data / IBM Plex Mono 400–600
                    </p>
                    <p className="mt-2 font-mono text-[11px] leading-relaxed">
                      APPROVAL / BASE SEPOLIA / 0.10 USDC
                    </p>
                  </div>
                </div>

                <div className="mt-6 border border-foreground bg-card p-4">
                  <p className="flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] uppercase">
                    <Lock className="size-3.5 text-primary" /> Rules
                  </p>
                  <ul className="mt-3 grid gap-2 text-[11px] leading-relaxed text-muted-foreground">
                    <li>Keep the mark square and flat. Do not outline, glow or gradient it.</li>
                    <li>Use bone paper as the default field; cobalt is for authorization, not decoration.</li>
                    <li>Signal orange is a stamp, a rule or a single accent. Never a background wash.</li>
                    <li>Write the promise exactly: “Give it a job. Keep the receipts.”</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b-2 border-foreground" aria-labelledby="proof-heading">
          <div className="mx-auto max-w-[1440px] px-4 py-16 md:px-8 md:py-20">
            <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-7">
                <p className="mono-label">04 / Proof</p>
                <h2 id="proof-heading" className="display-tight mt-4 text-4xl md:text-5xl">
                  Use the real product.
                </h2>
                <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
                  These are captures from the running app, not mockups. If you write about VANTA, link the workspace
                  and show the trace — the receipts are the story.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 lg:col-span-5 lg:justify-end">
                <a
                  href="/demo/05b-approval-card.png"
                  download
                  className="inline-flex items-center gap-2 border border-foreground px-4 py-3 font-mono text-[9px] tracking-wider uppercase hover:bg-foreground hover:text-background"
                >
                  <ImageIcon className="size-3.5" /> Approval shot
                </a>
                <a
                  href="/demo/04c-trace-card.png"
                  download
                  className="inline-flex items-center gap-2 border border-foreground px-4 py-3 font-mono text-[9px] tracking-wider uppercase hover:bg-foreground hover:text-background"
                >
                  <ImageIcon className="size-3.5" /> Trace shot
                </a>
                <a
                  href={REPO_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-primary px-4 py-3 font-mono text-[9px] tracking-wider text-primary-foreground uppercase hover:bg-foreground"
                >
                  Source <ArrowUpRight className="size-3.5" />
                </a>
              </div>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <figure className="border-2 border-foreground bg-card p-2 shadow-[8px_8px_0_rgba(20,22,26,0.12)] md:-rotate-1">
                <img
                  src="/demo/05b-approval-card.png"
                  alt="VANTA payment approval card on a real run"
                  width={1796}
                  height={694}
                  loading="lazy"
                  className="block h-auto w-full border border-foreground/20"
                />
                <figcaption className="px-1 pt-2 font-mono text-[9px] tracking-[0.12em] text-muted-foreground uppercase">
                  Approval card / paid mission held before execution
                </figcaption>
              </figure>
              <figure className="border-2 border-foreground bg-card p-2 shadow-[8px_8px_0_rgba(20,22,26,0.12)] md:rotate-1">
                <img
                  src="/demo/06c-sources-card.png"
                  alt="VANTA source list returned by a real research run"
                  width={1796}
                  height={470}
                  loading="lazy"
                  className="block h-auto w-full border border-foreground/20"
                />
                <figcaption className="px-1 pt-2 font-mono text-[9px] tracking-[0.12em] text-muted-foreground uppercase">
                  Sources / actual crawled titles and URLs
                </figcaption>
              </figure>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-[1440px] px-4 py-12 md:px-8">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div className="max-w-md">
            <div className="flex items-center gap-3">
              <VantaMark className="size-7" />
              <span className="font-heading text-sm font-extrabold tracking-[0.18em] uppercase">Vanta</span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              The brand kit is free to use for accurate coverage, reviews and submissions. Do not imply endorsement or
              use the mark for a competing product.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="/brand/vanta-brand-kit.zip"
              download
              className="inline-flex items-center gap-2 bg-foreground px-4 py-3 font-mono text-[9px] tracking-wider text-background uppercase hover:bg-primary"
            >
              <Download className="size-3.5" /> Download kit
            </a>
            <Link
              href="/"
              className="inline-flex items-center gap-2 border border-foreground px-4 py-3 font-mono text-[9px] tracking-wider uppercase hover:bg-foreground hover:text-background"
            >
              Back to VANTA
            </Link>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t-2 border-foreground pt-4 font-mono text-[9px] tracking-[0.14em] uppercase text-muted-foreground">
          <span>© {new Date().getFullYear()} VANTA demo · brand kit</span>
          <span>Field manual / assets / 001</span>
        </div>
      </footer>
    </div>
  );
}
