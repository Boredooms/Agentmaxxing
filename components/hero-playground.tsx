"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CircleAlert, Loader2, Lock, Play, Terminal } from "lucide-react";
import type { RunResult } from "@/agent/types";
import { savePending } from "@/lib/history";
import { cn } from "@/lib/utils";

const FREE_EXAMPLES = [
  "Calculate (18 * 4) / 3 and convert 12 km to miles",
  "Search for the x402 protocol and summarize what it is",
  'Format this JSON: {"agent":"vanta","paid":false,"tools":16}',
];

const PAID_EXAMPLES = [
  "What's the weather in Mumbai?",
  "Research the current state of agentic payments and prepare a cited briefing.",
];

export function HeroPlayground({ ready }: { ready: boolean }) {
  const [mission, setMission] = useState(FREE_EXAMPLES[0]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingStored, setPendingStored] = useState(false);

  async function run() {
    if (!mission.trim() || busy) return;
    setBusy(true);
    setError(null);
    setResult(null);
    setPendingStored(false);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mission }),
        signal: AbortSignal.timeout(90_000),
      });
      const data = (await res.json()) as RunResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? `Server returned ${res.status}`);
      setResult(data);
      if (data.status === "pending" && data.pending) {
        setPendingStored(savePending(data));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "The run failed.");
    } finally {
      setBusy(false);
    }
  }

  const pending = result?.status === "pending";

  return (
    <div className="receipt relative overflow-hidden" id="playground">
      <div className="receipt-edge" aria-hidden />
      <div className="relative flex items-center justify-between gap-3 border-b-2 border-foreground px-4 py-3">
        <div className="flex items-center gap-2">
          <Terminal className="size-3.5 text-signal" />
          <span className="font-mono text-[10px] font-medium tracking-[0.14em] uppercase">Mission input</span>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 border px-2 py-1 font-mono text-[9px] tracking-[0.12em] uppercase",
            ready ? "border-primary text-primary" : "border-foreground/40 text-muted-foreground"
          )}
        >
          <span className={cn("size-1.5", ready ? "bg-primary pulse-dot" : "bg-muted-foreground")} />
          {ready ? "Live agent" : "Demo mode"}
        </span>
      </div>

      <div className="relative p-4 md:p-5">
        <label htmlFor="landing-mission" className="mono-label mb-2 block">
          What should VANTA accomplish?
        </label>
        <textarea
          id="landing-mission"
          value={mission}
          onChange={(e) => setMission(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") run();
          }}
          rows={3}
          maxLength={2000}
          className="w-full resize-y border border-foreground/40 bg-background px-3 py-2.5 text-sm leading-relaxed outline-none placeholder:text-muted-foreground/70 focus:border-primary"
          placeholder="Describe the outcome, not the steps…"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          {FREE_EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setMission(example)}
              className="max-w-full truncate border border-foreground/25 bg-card px-2.5 py-1.5 font-mono text-[9px] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
              title={example}
            >
              <span className="mr-1 font-semibold text-primary">free</span>
              {example.length > 46 ? `${example.slice(0, 46)}…` : example}
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {PAID_EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setMission(example)}
              className="max-w-full truncate border border-foreground/25 bg-card px-2.5 py-1.5 font-mono text-[9px] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
              title={example}
            >
              <span className="mr-1 inline-flex items-center gap-1 font-semibold text-signal">
                <Lock className="size-2.5" /> paid
              </span>
              {example.length > 46 ? `${example.slice(0, 46)}…` : example}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={run}
            disabled={busy || !mission.trim()}
            className="inline-flex items-center gap-2 bg-primary px-4 py-2.5 font-mono text-[10px] font-semibold tracking-[0.12em] text-primary-foreground uppercase transition-colors hover:bg-foreground disabled:opacity-50"
          >
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
            {busy ? "Running…" : "Run mission"}
          </button>
          <Link
            href={`/workspace?mission=${encodeURIComponent(mission)}`}
            className="inline-flex items-center gap-1.5 border border-foreground px-3 py-2.5 font-mono text-[10px] tracking-[0.12em] uppercase text-foreground transition-colors hover:bg-foreground hover:text-background"
          >
            Open in workspace <ArrowRight className="size-3.5" />
          </Link>
          <span className="ml-auto font-mono text-[9px] tracking-[0.1em] uppercase text-muted-foreground">⌘/Ctrl + Enter</span>
        </div>

        {error && (              <div className="mt-4 flex items-start gap-2 border border-destructive bg-destructive/5 p-3 text-xs text-destructive">
            <CircleAlert className="mt-0.5 size-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="mt-5 border-t-2 border-foreground pt-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-[9px] tracking-[0.12em] uppercase text-muted-foreground">
                {result.mode} run · intent <span className="text-primary">{result.intent.label}</span> · {result.steps.length} tool
                step(s)
              </p>
              <span className="font-mono text-[9px] uppercase text-muted-foreground">
                {pending ? "awaiting approval" : "completed"}
              </span>
            </div>

            {pending && result.pending ? (
              <div className="border border-signal bg-signal-soft p-3">
                <p className="flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.12em] uppercase text-signal">
                  <Lock className="size-3.5" /> Approval required
                </p>
                <div className="mt-2 flex flex-col gap-1 font-mono text-xs text-muted-foreground">
                  {result.pending.calls.map((call) => (
                    <p key={call.id || call.tool}>
                      <span className="text-foreground">{call.tool}</span> · {call.cost} · {result.pending!.network}
                    </p>
                  ))}
                </div>
                <Link
                  href="/workspace?pending=1"
                  className="mt-3 inline-flex items-center gap-1.5 bg-primary px-3 py-2 font-mono text-[9px] font-semibold tracking-[0.12em] uppercase text-primary-foreground"
                >
                  Review in workspace <ArrowRight className="size-3" />
                </Link>
                {pendingStored && (
                  <p className="mt-2 font-mono text-[10px] uppercase text-muted-foreground">
                    The approval is held server-side and expires in 5 minutes.
                  </p>
                )}
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto scrollbar-thin border border-foreground/30 bg-background p-3">
                <p className="answer-text text-xs leading-relaxed text-foreground/85">{result.answer}</p>
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-3 font-mono text-[9px] uppercase text-muted-foreground">
              <span>{result.steps.filter((s) => !s.error).length} ok</span>
              <span>{result.steps.filter((s) => s.error).length} failed</span>
              <span>{result.steps.filter((s) => s.paid).length} paid</span>
              <a className="ml-auto text-primary hover:underline" href="#story-heading">
                How it works ↓
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
