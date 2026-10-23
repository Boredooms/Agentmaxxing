import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Boxes, Lock, Network, ShieldCheck, Wallet } from "lucide-react";
import { tools } from "@/agent/tools";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = { title: "Tools" };

const KIND_LABEL = {
  deterministic: "deterministic",
  network: "network",
  wallet: "wallet read",
  "paid-api": "paid api",
} as const;

const KIND_ICON = {
  deterministic: Boxes,
  network: Network,
  wallet: Wallet,
  "paid-api": Lock,
} as const;

export default function ToolsPage() {
  const free = tools.filter((t) => !t.cost);
  const paid = tools.filter((t) => t.cost);

  return (
    <AppShell title="Tools" eyebrow="Registry">
      <div className="flex flex-col gap-6">
        <section className="surface p-5">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-2xl">
              <p className="mono-label mb-2">The actual registry</p>
              <h2 className="display text-3xl md:text-4xl">
                {tools.length} tools.
                <br />
                No decorative integrations.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Every entry is callable by the server-side agent loop. Deterministic tools are pure functions with tests;
                network tools are fixed, allowlisted APIs; paid tools settle testnet USDC only after an explicit,
                server-validated approval.
              </p>
            </div>
            <dl className="grid grid-cols-3 divide-x divide-border border border-border">
              {[
                { label: "Total", value: tools.length },
                { label: "Free", value: free.length },
                { label: "Paid", value: paid.length },
              ].map((stat) => (
                <div key={stat.label} className="px-5 py-4 text-center">
                  <dt className="mono-label">{stat.label}</dt>
                  <dd className="mt-1 font-heading text-2xl font-semibold">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <ToolSection
          title="Free tools"
          note="Always advertised to the model. No wallet, no charge."
          tools={free}
          tone="free"
        />
        <ToolSection
          title="Paid tools"
          note="Advertised only when the intent layer unlocks them. Each call pauses for a single-use approval with an exact price and testnet network."
          tools={paid}
          tone="paid"
        />

        <section className="grid gap-4 md:grid-cols-3">
          <div className="border border-border p-4">
            <ShieldCheck className="size-4 text-primary" />
            <h3 className="mt-3 font-heading text-sm font-semibold">SSRF-guarded crawler</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              Host allowlist, DNS re-resolution, private-range rejection, port restrictions and redirect re-validation.
            </p>
          </div>
          <div className="border border-border p-4">
            <Lock className="size-4 text-primary" />
            <h3 className="mt-3 font-heading text-sm font-semibold">Server-issued approvals</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              The browser receives an opaque id, never resumable model state. Approvals are consumed before execution.
            </p>
          </div>
          <div className="border border-border p-4">
            <Wallet className="size-4 text-primary" />
            <h3 className="mt-3 font-heading text-sm font-semibold">Testnet settlement</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              EIP-3009 USDC authorization on Base Sepolia, submitted by a facilitator. No mainnet path exists.
            </p>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 border border-border px-4 py-3">
          <p className="text-xs text-muted-foreground">Want to see a tool run with its real payload?</p>
          <Link
            href="/workspace"
            className="inline-flex items-center gap-1.5 bg-primary px-3 py-2 font-mono text-[10px] font-bold tracking-wider uppercase text-primary-foreground"
          >
            Open workspace <ArrowUpRight className="size-3" />
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

function ToolSection({
  title,
  note,
  tools: list,
  tone,
}: {
  title: string;
  note: string;
  tools: typeof tools;
  tone: "free" | "paid";
}) {
  return (
    <section aria-labelledby={`${tone}-tools`}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id={`${tone}-tools`} className="flex items-center gap-2 font-heading text-xl font-semibold">
            {tone === "paid" && <Lock className="size-4 text-primary" />}
            {title}
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">{note}</p>
        </div>
        <span className="mono-label">{list.length} registered</span>
      </div>

      <div className="grid w-full min-w-0 border-t border-l border-border md:grid-cols-2">
        {list.map((tool) => {
          const KindIcon = KIND_ICON[tool.kind];
          return (
            <article key={tool.name} className="flex min-w-0 flex-col gap-3 overflow-hidden border-r border-b border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-mono text-xs text-primary">{tool.name}</h3>
                  <p className="mt-1 inline-flex items-center gap-1.5 font-mono text-[9px] tracking-wider uppercase text-muted-foreground">
                    <KindIcon className="size-2.5" /> {KIND_LABEL[tool.kind]}
                  </p>
                </div>
                <span
                  className={
                    tool.cost
                      ? "border border-primary/40 bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] tracking-wider uppercase text-primary"
                      : "border border-border px-1.5 py-0.5 font-mono text-[9px] tracking-wider uppercase text-muted-foreground"
                  }
                >
                  {tool.cost ?? "free"}
                </span>
              </div>

              <p className="text-xs leading-relaxed text-muted-foreground">{tool.description}</p>

              {tool.example && (
                <p className="truncate border-l border-border pl-2 font-mono text-[10px] text-muted-foreground" title={tool.example}>
                  {tool.example}
                </p>
              )}

              <details className="mt-auto group">
                <summary className="cursor-pointer font-mono text-[9px] tracking-wider uppercase text-muted-foreground hover:text-foreground">
                  Input schema
                </summary>
                <pre className="mt-2 max-h-44 w-full max-w-full overflow-auto scrollbar-thin border border-border bg-background p-2 font-mono text-[9px] leading-relaxed break-all whitespace-pre-wrap text-foreground/70">
                  {JSON.stringify(tool.parameters, null, 2)}
                </pre>
              </details>
            </article>
          );
        })}
      </div>
    </section>
  );
}
