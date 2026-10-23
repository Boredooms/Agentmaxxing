"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Check,
  CircleAlert,
  Cpu,
  Database,
  ExternalLink,
  KeyRound,
  Loader2,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { WalletCard } from "@/components/wallet-card";
import { clearRuns, loadRuns } from "@/lib/history";
import { REPO_URL } from "@/lib/nav";

type Runtime = {
  ready: boolean;
  mode: "live" | "demo";
  model: string;
  network: string;
  spending: { perRunUsdc: number };
  walletConfigured: boolean;
  facilitatorConfigured: boolean;
  tools: { name: string; paid: boolean }[];
};

export function SettingsPanel() {
  const [runtime, setRuntime] = useState<Runtime | null>(null);
  const [failed, setFailed] = useState(false);
  const [runCount, setRunCount] = useState(0);

  useEffect(() => {
    setRunCount(loadRuns().length);
    fetch("/api/agent")
      .then((r) => r.json())
      .then((r) => {
        if (r?.error) throw new Error();
        setRuntime(r);
      })
      .catch(() => setFailed(true));
  }, []);

  const free = runtime?.tools.filter((t) => !t.paid).length ?? 0;
  const paid = runtime?.tools.filter((t) => t.paid).length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      {failed && (
        <div className="flex items-start gap-2 border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
          <CircleAlert className="mt-0.5 size-3.5" /> Could not read runtime settings. Is the server running?
        </div>
      )}

      <section className="surface" aria-labelledby="readiness">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 id="readiness" className="flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] uppercase">
            <Cpu className="size-3.5 text-primary" /> Runtime readiness
          </h2>
          <span className="font-mono text-[9px] tracking-wider uppercase text-muted-foreground">
            secrets are reported as booleans only
          </span>
        </div>

        {!runtime ? (
          <p className="flex items-center gap-2 px-4 py-6 font-mono text-[11px] text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" /> Reading runtime…
          </p>
        ) : (
          <>
            <dl className="divide-y divide-border">
              {[
                {
                  icon: KeyRound,
                  label: "Gemini API key",
                  ok: runtime.ready,
                  value: runtime.ready ? "present" : "missing",
                  note: runtime.ready
                    ? "Live model-driven loop is available."
                    : "Demo planner runs real free tools; no model call is simulated.",
                },
                {
                  icon: SlidersHorizontal,
                  label: "Active model",
                  ok: runtime.ready,
                  value: runtime.model,
                  note: "Switch with GEMINI_MODEL; any model your key can access.",
                },
                {
                  icon: ShieldCheck,
                  label: "Payment facilitator",
                  ok: runtime.facilitatorConfigured,
                  value: runtime.facilitatorConfigured ? "configured" : "missing",
                  note: "Without it, paid APIs cannot verify or settle testnet USDC.",
                },
                {
                  icon: Database,
                  label: "Agent wallet",
                  ok: runtime.walletConfigured,
                  value: runtime.walletConfigured ? "configured" : "missing",
                  note: "A testnet key is required for paid tools. Free tools never need it.",
                },
              ].map(({ icon: Icon, label, ok, value, note }) => (
                <div key={label} className="grid gap-2 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="flex items-start gap-3">
                    <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div>
                      <dt className="text-xs font-medium">{label}</dt>
                      <dd className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{note}</dd>
                    </div>
                  </div>
                  <span
                    className={
                      ok
                        ? "inline-flex items-center gap-1.5 self-start border border-primary/40 bg-primary/10 px-2 py-1 font-mono text-[9px] tracking-wider uppercase text-primary sm:self-center"
                        : "inline-flex items-center gap-1.5 self-start border border-border px-2 py-1 font-mono text-[9px] tracking-wider uppercase text-muted-foreground sm:self-center"
                    }
                  >
                    {ok ? <Check className="size-3" /> : <X className="size-3" />}
                    {value}
                  </span>
                </div>
              ))}
            </dl>
            <div className="grid gap-0 border-t border-border sm:grid-cols-3">
              {[
                { label: "Mode", value: runtime.mode },
                { label: "Network", value: runtime.network },
                { label: "Tools", value: `${free} free / ${paid} paid` },
              ].map((item) => (
                <div key={item.label} className="border-b border-border px-4 py-3 sm:border-r sm:border-b-0 sm:last:border-r-0">
                  <p className="mono-label">{item.label}</p>
                  <p className="mt-1 font-mono text-[11px] text-foreground/85">{item.value}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <WalletCard allowCreate />

        <section className="surface p-4" aria-labelledby="spending">
          <h2 id="spending" className="flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] uppercase">
            <SlidersHorizontal className="size-3.5 text-primary" /> Spending limits
          </h2>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Hard ceiling per run. Enforced before an approval card is shown and re-checked when the stored approval is
            consumed.
          </p>
          <div className="mt-4 flex items-end justify-between border border-border bg-background px-3 py-3">
            <div>
              <p className="mono-label">Per-run ceiling</p>
              <p className="mt-1 font-heading text-2xl font-semibold">
                {runtime ? runtime.spending.perRunUsdc.toFixed(2) : "0.25"} <span className="text-sm text-muted-foreground">USDC</span>
              </p>
            </div>
            <span className="font-mono text-[9px] uppercase text-muted-foreground">testnet</span>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            Override server-side with <code className="font-mono text-foreground/80">MAX_RUN_SPEND_USDC</code> (0–5). Per-tool
            prices are fixed in the registry. There is no mainnet path.
          </p>
        </section>

        <section className="surface p-4" aria-labelledby="data">
          <h2 id="data" className="flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] uppercase">
            <Database className="size-3.5 text-primary" /> Data &amp; history
          </h2>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Run history and the activity ledger live in this browser&apos;s local storage. They are not account-synced and
            not durable server records. Pending approvals are held server-side in memory and expire after five minutes.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="border border-border px-2 py-1 font-mono text-[9px] uppercase text-muted-foreground">
              {runCount} local run(s)
            </span>
            <button
              type="button"
              onClick={() => {
                clearRuns();
                setRunCount(0);
              }}
              className="inline-flex items-center gap-1.5 border border-border px-2 py-1 font-mono text-[9px] tracking-wider uppercase text-muted-foreground hover:border-destructive/60 hover:text-destructive"
            >
              <Trash2 className="size-3" /> Clear local history
            </button>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            Secrets never enter localStorage, prompts, logs or the audit trail. API key values are never rendered.
          </p>
        </section>

        <section className="surface p-4" aria-labelledby="configure">
          <h2 id="configure" className="flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] uppercase">
            <KeyRound className="size-3.5 text-primary" /> Configuration
          </h2>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Create <code className="font-mono text-foreground/80">.env</code> from{" "}
            <code className="font-mono text-foreground/80">.env.example</code>. Names only:
          </p>
          <ul className="mt-3 grid gap-1.5 font-mono text-[10px] text-muted-foreground sm:grid-cols-2">
            {[
              "GEMINI_API_KEY",
              "GEMINI_MODEL",
              "WALLET_PRIVATE_KEY",
              "FACILITATOR_PRIVATE_KEY",
              "MAX_RUN_SPEND_USDC",
              "CRAWL_ALLOWED_HOSTS",
            ].map((name) => (
              <li key={name} className="border border-border px-2 py-1">
                {name}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 border border-border px-2.5 py-1.5 font-mono text-[9px] tracking-wider uppercase text-muted-foreground hover:border-primary/50 hover:text-foreground"
            >
              Setup docs <ExternalLink className="size-3" />
            </a>
            <Link
              href="/tools"
              className="inline-flex items-center gap-1.5 border border-border px-2.5 py-1.5 font-mono text-[9px] tracking-wider uppercase text-muted-foreground hover:border-primary/50 hover:text-foreground"
            >
              Tool catalog
            </Link>
          </div>
        </section>
      </div>

      <section className="border border-border p-4" aria-labelledby="security">
        <h2 id="security" className="flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] uppercase">
          <ShieldCheck className="size-3.5 text-primary" /> Security notes
        </h2>
        <ul className="mt-3 grid gap-2 text-[11px] leading-relaxed text-muted-foreground md:grid-cols-2">
          <li>Approval ids are opaque, server-issued, single-use and expire after 5 minutes.</li>
          <li>The client never receives the model/tool state needed to resume a paid run.</li>
          <li>Denial cannot invoke a paid tool; approve re-validates the tool, price, intent and budget.</li>
          <li>Research crawling re-validates DNS and host allowlists on every redirect hop.</li>
          <li>Paid endpoints verify EIP-3009 signatures and reject replayed nonces.</li>
          <li>Request bodies are bounded and the agent endpoint is rate limited per IP.</li>
        </ul>
        <p className="mt-3 border-t border-border pt-3 text-[10px] leading-relaxed text-muted-foreground">
          Demo-scale limitation: pending approvals are stored in process memory. A multi-instance deployment needs a
          shared store keyed by the same opaque id. This is stated in the README rather than hidden.
        </p>
      </section>
    </div>
  );
}
