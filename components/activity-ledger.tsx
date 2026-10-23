"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, CircleAlert, ExternalLink, Lock, ReceiptText, Trash2, XCircle } from "lucide-react";
import type { RunResult } from "@/agent/types";
import { clearRuns, loadRuns } from "@/lib/history";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  at: string;
  kind: "run" | "approval" | "decision" | "settlement" | "error";
  title: string;
  detail: string;
  amount?: string;
  status?: string;
  href?: string;
};

function timeOf(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString([], { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function buildRows(runs: RunResult[]): Row[] {
  const rows: Row[] = [];
  for (const run of runs) {
    rows.push({
      id: `${run.runId}-run`,
      at: run.startedAt,
      kind: "run",
      title: run.mission,
      detail: `${run.mode} run · ${run.steps.length} tool call(s) · intent ${run.intent.label}`,
      status: run.status,
    });
    for (const event of run.events) {
      if (event.type === "approval_requested") {
        rows.push({
          id: `${run.runId}-req-${event.seq}`,
          at: event.at,
          kind: "approval",
          title: "Payment approval requested",
          detail: event.message,
          amount: event.amount,
        });
      }
      if (event.type === "approval_decision") {
        rows.push({
          id: `${run.runId}-dec-${event.seq}`,
          at: event.at,
          kind: "decision",
          title: event.ok === false ? "Paid work denied or refused" : "Spending approved",
          detail: event.message,
          amount: event.amount,
        });
      }
      if (event.type === "error" || event.type === "budget" || event.type === "policy") {
        rows.push({
          id: `${run.runId}-err-${event.seq}`,
          at: event.at,
          kind: "error",
          title:
            event.type === "budget"
              ? "Budget guard triggered"
              : event.type === "policy"
                ? "Approval policy blocked a repeat charge"
                : "Run error",
          detail: event.message,
        });
      }
    }
    for (const step of run.steps) {
      const payment = (step.result as { payment?: { txHash?: string; amount?: string; explorer?: string } } | null)?.payment;
      if (payment?.txHash) {
        rows.push({
          id: `${run.runId}-tx-${step.id}`,
          at: step.startedAt,
          kind: "settlement",
          title: `${step.tool} settled on-chain`,
          detail: `Base Sepolia · ${payment.txHash}`,
          amount: payment.amount,
          href: payment.explorer ?? `https://sepolia.basescan.org/tx/${payment.txHash}`,
        });
      }
    }
  }
  return rows.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

const SAMPLE: Row[] = [
  {
    id: "sample-1",
    at: new Date().toISOString(),
    kind: "run",
    title: "Research the current state of agentic payments and prepare a cited briefing",
    detail: "sample run · 3 tool calls · intent research",
    status: "sample",
  },
  {
    id: "sample-2",
    at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    kind: "approval",
    title: "Payment approval requested",
    detail: "research_web — deep crawl of top sources, Base Sepolia testnet",
    amount: "0.10 USDC",
  },
  {
    id: "sample-3",
    at: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    kind: "decision",
    title: "Spending approved",
    detail: "Approval consumed once server-side; paid tool resumed under the original intent.",
    amount: "0.10 USDC",
  },
  {
    id: "sample-4",
    at: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    kind: "settlement",
    title: "research_web settled on-chain",
    detail: "Base Sepolia · sample receipt (not a real transaction)",
    amount: "0.10 USDC",
  },
];

const KIND_META = {
  run: { icon: ReceiptText, tone: "text-muted-foreground", label: "run" },
  approval: { icon: Lock, tone: "text-primary", label: "approval" },
  decision: { icon: CheckCircle2, tone: "text-primary", label: "decision" },
  settlement: { icon: ExternalLink, tone: "text-primary", label: "settlement" },
  error: { icon: XCircle, tone: "text-destructive", label: "error" },
} as const;

export function ActivityLedger() {
  const [runs, setRuns] = useState<RunResult[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setRuns(loadRuns());
    setLoaded(true);
  }, []);

  const rows = useMemo(() => buildRows(runs), [runs]);
  const sample = loaded && rows.length === 0;
  const shown = sample ? SAMPLE : rows;

  const toolCalls = runs.reduce((sum, r) => sum + r.steps.length, 0);
  const settlements = rows.filter((r) => r.kind === "settlement").length;
  const approvals = rows.filter((r) => r.kind === "decision" && r.title.includes("approved")).length;

  return (
    <div className="flex flex-col gap-6">
      <section className="surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="mono-label mb-2">Audit trail</p>
            <h2 className="display text-3xl md:text-4xl">
              Every run leaves
              <br />
              a paper trail.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Tool calls, approval requests, decisions, errors and testnet receipts. This ledger is{" "}
              <span className="text-foreground">stored in this browser only</span> — it is not account-synced or server-durable.
            </p>
          </div>
          <dl className="grid grid-cols-3 divide-x divide-border border border-border">
            {[
              { label: "Runs", value: runs.length },
              { label: "Tool calls", value: toolCalls },
              { label: "Settlements", value: settlements },
            ].map((stat) => (
              <div key={stat.label} className="px-4 py-4 text-center">
                <dt className="mono-label">{stat.label}</dt>
                <dd className="mt-1 font-heading text-2xl font-semibold">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-3">
          <span className="font-mono text-[9px] tracking-wider uppercase text-muted-foreground">
            {runs.length} run(s) · {approvals} approved · local only
          </span>
          {runs.length > 0 && (
            <button
              type="button"
              onClick={() => {
                clearRuns();
                setRuns([]);
              }}
              className="ml-auto inline-flex items-center gap-1.5 border border-border px-2 py-1 font-mono text-[9px] tracking-wider uppercase text-muted-foreground hover:border-destructive/60 hover:text-destructive"
            >
              <Trash2 className="size-3" /> Clear browser history
            </button>
          )}
        </div>
      </section>

      {sample && (
        <div className="flex flex-wrap items-center gap-2 border border-primary/30 bg-primary/5 px-3 py-2">
          <span className="border border-primary/40 px-1.5 py-0.5 font-mono text-[9px] tracking-wider uppercase text-primary">Sample</span>
          <p className="text-xs text-muted-foreground">
            No real runs yet. These rows are illustrative and are not a transaction record.
          </p>
          <Link href="/workspace" className="ml-auto font-mono text-[10px] uppercase text-primary hover:underline">
            Run a mission →
          </Link>
        </div>
      )}

      <section className="surface overflow-hidden" aria-labelledby="ledger-heading">
        <div className="hidden grid-cols-[140px_1fr_140px_120px] gap-3 border-b border-border px-4 py-2.5 font-mono text-[9px] tracking-[0.14em] uppercase text-muted-foreground md:grid">
          <span>When</span>
          <span>Event</span>
          <span>Amount</span>
          <span>Status</span>
        </div>

        {shown.length === 0 ? (
          <div className="px-4 py-14 text-center">
            <ReceiptText className="mx-auto size-6 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No activity recorded in this browser yet.</p>
            <Link
              href="/workspace"
              className="mt-4 inline-flex items-center gap-1.5 bg-primary px-3 py-2 font-mono text-[10px] font-bold tracking-wider uppercase text-primary-foreground"
            >
              Start a mission <ArrowUpRight className="size-3" />
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {shown.map((row) => {
              const meta = KIND_META[row.kind];
              const Icon = meta.icon;
              return (
                <li key={row.id} className="grid gap-2 px-4 py-3 md:grid-cols-[140px_1fr_140px_120px] md:items-start md:gap-3">
                  <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
                    <Icon className={cn("size-3.5 shrink-0", meta.tone)} />
                    {timeOf(row.at)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs leading-snug text-foreground/90">{row.title}</p>
                    <p className="mt-0.5 font-mono text-[10px] leading-relaxed text-muted-foreground">{row.detail}</p>
                    {row.href && (
                      <a
                        href={row.href}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 font-mono text-[9px] uppercase text-primary hover:underline"
                      >
                        Explorer <ExternalLink className="size-2.5" />
                      </a>
                    )}
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground md:text-right">{row.amount ?? "—"}</div>
                  <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase text-muted-foreground md:justify-end">
                    {row.kind === "error" ? <CircleAlert className="size-3 text-destructive" /> : null}
                    {sample ? "sample" : row.status ?? meta.label}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="font-mono text-[9px] leading-relaxed tracking-wider uppercase text-muted-foreground">
        Payments are Base Sepolia testnet USDC only. Sample rows are not transactions. Clearing browser history does not
        affect server-side approvals, which expire after five minutes.
      </p>
    </div>
  );
}
