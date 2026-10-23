"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  CircleAlert,
  CircleDashed,
  Clock,
  Copy,
  ExternalLink,
  FileCode2,
  History,
  Loader2,
  Lock,
  Play,
  RotateCcw,
  ShieldCheck,
  Square,
  Terminal,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import type { PlanStatus, RunEvent, RunResult, ToolStep } from "@/agent/types";
import { WalletCard } from "@/components/wallet-card";
import { clearPending, clearRuns, durationMs, loadPending, loadRuns, savePending, saveRun } from "@/lib/history";
import { cn } from "@/lib/utils";

type Runtime = {
  ready: boolean;
  mode: "live" | "demo";
  model: string;
  network: string;
  spending: { perRunUsdc: number };
  walletConfigured: boolean;
  facilitatorConfigured: boolean;
};

const EXAMPLES = [
  { label: "Free · calculate + convert", mission: "Calculate (18 * 4) / 3 and convert 12 km to miles." },
  { label: "Free · summarise", mission: "Summarize this in three sentences: VANTA is an observable agent. It plans work, runs real tools and shows every step. Paid tools pause for a server-verified approval, and denial never executes them." },
  { label: "Free · JSON check", mission: 'Format and validate this JSON: {"agent":"vanta","tools":16,"paid":false}' },
  { label: "Free · search", mission: "Search for the x402 protocol and summarize what it is." },
  { label: "Paid · weather", mission: "What's the weather in Mumbai?" },
  { label: "Paid · research", mission: "Research the current state of agentic payments, compare several sources, and prepare a concise cited briefing. Show me each step and ask before using a paid tool." },
];

function timeOf(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleTimeString([], { hour12: false });
}

function msLabel(ms: number) {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(ms < 10_000 ? 2 : 1)} s`;
}

function planIcon(status: PlanStatus) {
  switch (status) {
    case "complete":
      return <CheckCircle2 className="size-3.5 text-primary" />;
    case "running":
      return <Loader2 className="size-3.5 animate-spin text-foreground" />;
    case "awaiting-approval":
      return <Lock className="size-3.5 text-primary" />;
    case "blocked":
      return <CircleAlert className="size-3.5 text-destructive" />;
    case "skipped":
      return <CircleDashed className="size-3.5 text-muted-foreground" />;
    default:
      return <Circle className="size-3.5 text-muted-foreground" />;
  }
}

function statusTone(status: PlanStatus) {
  if (status === "complete") return "text-foreground";
  if (status === "running" || status === "awaiting-approval") return "text-primary";
  if (status === "blocked") return "text-destructive";
  return "text-muted-foreground";
}

function eventTone(type: RunEvent["type"]) {
  if (type === "tool_result") return "bg-primary";
  if (type === "approval_requested" || type === "approval_decision") return "bg-indigo";
  if (type === "error" || type === "budget" || type === "policy") return "bg-destructive";
  return "bg-muted-foreground/60";
}

function sourcesOf(steps: ToolStep[]) {
  const out: { title: string; url: string; excerpt?: string }[] = [];
  for (const step of steps) {
    const result = step.result as { findings?: unknown; results?: unknown } | null;
    const buckets = [result?.findings, result?.results];
    for (const bucket of buckets) {
      if (!Array.isArray(bucket)) continue;
      for (const item of bucket) {
        if (!item || typeof item !== "object") continue;
        const row = item as { title?: unknown; url?: unknown; excerpt?: unknown };
        if (typeof row.url !== "string" || !/^https?:\/\//i.test(row.url)) continue;
        if (out.some((s) => s.url === row.url)) continue;
        out.push({
          title: typeof row.title === "string" && row.title ? row.title : row.url,
          url: row.url,
          excerpt: typeof row.excerpt === "string" ? row.excerpt : undefined,
        });
      }
    }
  }
  return out.slice(0, 8);
}

export function WorkspaceConsole() {
  const [runtime, setRuntime] = useState<Runtime | null>(null);
  const [mission, setMission] = useState("");
  const [running, setRunning] = useState(false);
  const [run, setRun] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [runs, setRuns] = useState<RunResult[]>([]);
  const [walletRefresh, setWalletRefresh] = useState(0);
  const [deciding, setDeciding] = useState<"approved" | "deny" | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetch("/api/agent")
      .then((r) => r.json())
      .then((r) => setRuntime(r))
      .catch(() => setRuntime(null));
    setRuns(loadRuns());
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("mission");
    if (requested) setMission(requested);
    if (params.get("new") === "1") {
      setRun(null);
      setMission("");
      clearPending();
    }
    if (params.get("pending") === "1") {
      const pending = loadPending();
      if (pending) setRun(pending);
    }
  }, []);

  useEffect(() => {
    if (!run?.pending) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [run?.pending, run?.pending?.id]);

  const remember = useCallback((next: RunResult) => {
    setRun(next);
    setRuns(saveRun(next));
    if (next.status === "pending") savePending(next);
    else clearPending();
    if (next.steps.some((s) => s.paid && !s.error)) setWalletRefresh((n) => n + 1);
  }, []);

  async function start() {
    if (!mission.trim() || running) return;
    setRunning(true);
    setError(null);
    setNotice(null);
    setRun(null);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mission }),
        signal: controller.signal,
      });
      const data = (await res.json()) as RunResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? `Server returned ${res.status}`);
      remember(data);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setNotice(
          "You stopped waiting for this run. The server may still finish an in-flight tool call, and a payment that was already approved cannot be recalled."
        );
      } else {
        setError(err instanceof Error ? err.message : "The run failed.");
      }
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  async function decide(decision: "approved" | "deny") {
    if (!run?.pending || deciding) return;
    setDeciding(decision);
    setError(null);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalId: run.pending.id, decision }),
      });
      const data = (await res.json()) as RunResult & { error?: string };
      if (!res.ok) {
        if (res.status === 404 || res.status === 409) {
          clearPending();
          throw new Error(
            `${data.error ?? "This approval is no longer valid."} The run cannot be resumed; start it again — no double charge is possible.`
          );
        }
        throw new Error(data.error ?? `Server returned ${res.status}`);
      }
      remember(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resume the run.");
    } finally {
      setDeciding(null);
    }
  }

  const sources = useMemo(() => (run ? sourcesOf(run.steps) : []), [run]);
  const completed = run?.plan.filter((p) => p.status === "complete" || p.status === "skipped").length ?? 0;
  const totalPlan = run?.plan.length ?? 4;
  const currentPlan = run?.plan.find((p) => p.status === "running" || p.status === "awaiting-approval");

  return (
    <div className="flex flex-col gap-6">
      {/* readiness banner */}
      {runtime && !runtime.ready && (
        <div className="flex flex-wrap items-start gap-2 border border-border bg-muted/40 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <span>
            <span className="font-mono text-[10px] tracking-wider uppercase text-primary">Demo mode</span> — no{" "}
            <code className="font-mono">GEMINI_API_KEY</code>. A deterministic planner runs real free tools; no model call or
            payment is simulated.
          </span>
        </div>
      )}

      {/* composer */}
      <section className="surface" aria-labelledby="mission-heading">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
          <h2 id="mission-heading" className="font-mono text-[11px] tracking-[0.14em] uppercase">
            What should VANTA accomplish?
          </h2>
          <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] tracking-wider uppercase text-muted-foreground">
            <span className="border border-border px-1.5 py-0.5">
              {runtime?.mode === "live" ? "Live · " + runtime.model : runtime ? "Demo planner" : "Checking runtime"}
            </span>
            <span className="border border-border px-1.5 py-0.5">{runtime?.network ?? "Base Sepolia · testnet"}</span>
          </div>
        </div>

        <div className="p-4">
          <label htmlFor="mission" className="sr-only">
            Mission
          </label>
          <textarea
            id="mission"
            value={mission}
            onChange={(e) => setMission(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                start();
              }
            }}
            rows={3}
            maxLength={2000}
            placeholder="Describe the outcome you want… e.g. research agentic payments, compare sources and prepare a cited briefing."
            className="w-full resize-y border border-border bg-background px-3 py-3 text-sm leading-relaxed outline-none placeholder:text-muted-foreground/70 focus:border-primary"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {EXAMPLES.map((example) => (
              <button
                key={example.label}
                type="button"
                onClick={() => setMission(example.mission)}
                className="border border-border bg-background px-2 py-1 font-mono text-[10px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                title={example.mission}
              >
                {example.label}
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={start}
              disabled={running || !mission.trim()}
              className="inline-flex items-center gap-2 bg-primary px-4 py-2.5 font-mono text-[10px] font-semibold tracking-[0.12em] uppercase text-primary-foreground transition-colors hover:bg-foreground disabled:opacity-50"
            >
              {running ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
              {running ? "Running mission…" : "Run mission"}
            </button>
            {running && (
              <button
                type="button"
                onClick={stop}
                className="inline-flex items-center gap-2 border border-border px-3 py-2.5 font-mono text-[11px] tracking-wider uppercase text-muted-foreground hover:border-destructive/60 hover:text-destructive"
              >
                <Square className="size-3" /> Stop
              </button>
            )}
            {run && !running && (
              <button
                type="button"
                onClick={() => {
                  setRun(null);
                  setError(null);
                  setNotice(null);
                }}
                className="inline-flex items-center gap-1.5 border border-border px-3 py-2.5 font-mono text-[10px] tracking-wider uppercase text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="size-3" /> Clear view
              </button>
            )}
            <span className="ml-auto font-mono text-[10px] tracking-wider uppercase text-muted-foreground">
              {runtime ? `${runtime.spending.perRunUsdc.toFixed(2)} USDC max / run · ⌘↵` : "⌘/Ctrl + Enter"}
            </span>
          </div>

          {running && (
            <p className="mt-2 font-mono text-[10px] leading-relaxed text-muted-foreground">
              Stop abandons this browser&apos;s wait. A tool already in flight is not interruptible, and an approved payment
              is final.
            </p>
          )}
          {notice && <p className="mt-3 border-l-2 border-primary pl-3 text-xs leading-relaxed text-muted-foreground">{notice}</p>}
          {error && (
            <div className="mt-3 flex items-start gap-2 border border-destructive/40 bg-destructive/10 p-3 text-xs leading-relaxed text-destructive">
              <CircleAlert className="mt-0.5 size-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </section>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_352px]">
        {/* left column */}
        <div className="flex min-w-0 flex-col gap-6">
          {!run && !running && (
            <section className="border border-dashed border-border px-6 py-14 text-center">
              <Terminal className="mx-auto size-7 text-muted-foreground" />
              <p className="mt-4 font-heading text-xl font-semibold">No run yet.</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                Start with a free mission to see the trace. Then try a paid mission — VANTA will stop and ask before
                spending.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Link
                  href="/tools"
                  className="inline-flex items-center gap-1.5 border border-border px-3 py-2 font-mono text-[10px] tracking-wider uppercase text-muted-foreground hover:border-primary/50 hover:text-foreground"
                >
                  Browse tools <ArrowUpRight className="size-3" />
                </Link>
                <Link
                  href="/activity"
                  className="inline-flex items-center gap-1.5 border border-border px-3 py-2 font-mono text-[10px] tracking-wider uppercase text-muted-foreground hover:border-primary/50 hover:text-foreground"
                >
                  Ledger <ArrowUpRight className="size-3" />
                </Link>
              </div>
            </section>
          )}

          {running && !run && (
            <section className="surface flex items-center gap-3 p-5" aria-live="polite">
              <Loader2 className="size-4 animate-spin text-primary" />
              <div>
                <p className="font-mono text-[11px] tracking-wider uppercase">Agent running</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Planning, calling tools and collecting evidence. The trace appears when the server returns.
                </p>
              </div>
            </section>
          )}

          {run && (
            <>
              {/* run status */}
              <section className="surface" aria-labelledby="run-heading">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 id="run-heading" className="font-mono text-[11px] tracking-[0.14em] uppercase">
                      Run status
                    </h2>
                    <span
                      className={cn(
                        "border px-1.5 py-0.5 font-mono text-[9px] tracking-wider uppercase",
                        run.status === "pending"
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border text-muted-foreground"
                      )}
                    >
                      {run.status === "pending" ? "awaiting approval" : "completed"}
                    </span>
                    <span className="border border-border px-1.5 py-0.5 font-mono text-[9px] tracking-wider uppercase text-muted-foreground">
                      {run.mode}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] tracking-wider uppercase text-muted-foreground">
                    {run.status === "completed" ? msLabel(durationMs(run)) : "paused"} · {completed}/{totalPlan} plan
                  </span>
                </div>

                <div className="grid gap-4 p-4 md:grid-cols-[1fr_auto]">
                  <div className="min-w-0">
                    <p className="text-sm leading-relaxed text-foreground/90">{run.mission}</p>
                    <p className="mt-2 font-mono text-[10px] tracking-wider uppercase text-muted-foreground">
                      intent <span className="text-primary">{run.intent.label}</span> · {run.intent.note}
                    </p>
                    {currentPlan && (
                      <p className="mt-2 flex items-center gap-2 font-mono text-[11px] text-foreground/80" aria-live="polite">
                        {planIcon(currentPlan.status)} {currentPlan.title}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5" aria-hidden>
                    {run.plan.map((item) => (
                      <span
                        key={item.id}
                        title={`${item.title} — ${item.status}`}
                        className={cn(
                          "h-8 w-1",
                          item.status === "complete" && "bg-primary",
                          item.status === "running" && "bg-foreground animate-pulse",
                          item.status === "awaiting-approval" && "bg-primary animate-pulse",
                          item.status === "blocked" && "bg-destructive",
                          (item.status === "queued" || item.status === "skipped") && "bg-border"
                        )}
                      />
                    ))}
                  </div>
                </div>

                <ol className="grid gap-0 border-t border-border sm:grid-cols-2">
                  {run.plan.map((item) => (
                    <li key={item.id} className="flex items-start gap-2.5 border-b border-border px-4 py-3 sm:odd:border-r">
                      <span className="mt-0.5">{planIcon(item.status)}</span>
                      <div className="min-w-0">
                        <p className={cn("text-xs font-medium", statusTone(item.status))}>{item.title}</p>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{item.detail}</p>
                      </div>
                      <span className="ml-auto shrink-0 font-mono text-[9px] tracking-wider uppercase text-muted-foreground">
                        {item.status}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>

              {/* approval */}
              {run.status === "pending" && run.pending && (
                <ApprovalPanel
                  run={run}
                  now={now}
                  deciding={deciding}
                  onDecision={decide}
                />
              )}

              {/* answer */}
              {run.answer && (
                <section className="surface scroll-mt-24" aria-labelledby="result-heading">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
                    <h2 id="result-heading" className="font-mono text-[11px] tracking-[0.14em] uppercase">
                      Result
                    </h2>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(run.answer ?? "")}
                      className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="size-3" /> Copy
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="answer-text text-sm text-foreground/90">{run.answer}</div>
                    {run.note && (
                      <p className="mt-4 border-l-2 border-border pl-3 font-mono text-[10px] leading-relaxed tracking-wide text-muted-foreground">
                        {run.note}
                      </p>
                    )}
                  </div>
                </section>
              )}

              {/* sources */}
              {sources.length > 0 && (
                <section className="surface" aria-labelledby="sources-heading">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <h2 id="sources-heading" className="font-mono text-[11px] tracking-[0.14em] uppercase">
                      Sources returned by tools
                    </h2>
                    <span className="font-mono text-[10px] uppercase text-muted-foreground">{sources.length}</span>
                  </div>
                  <ul className="divide-y divide-border">
                    {sources.map((source) => (
                      <li key={source.url} className="px-4 py-3">
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="group flex items-start gap-2 text-sm text-foreground/90 hover:text-primary"
                        >
                          <ExternalLink className="mt-1 size-3 shrink-0 text-primary" />
                          <span className="min-w-0 break-words">{source.title}</span>
                        </a>
                        <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground">{source.url}</p>
                        {source.excerpt && (
                          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">{source.excerpt}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* trace */}
              <section className="surface" aria-labelledby="trace-heading">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
                  <h2 id="trace-heading" className="flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] uppercase">
                    <FileCode2 className="size-3.5 text-primary" /> Execution trace
                  </h2>
                  <span className="font-mono text-[10px] tracking-wider uppercase text-muted-foreground">
                    {run.steps.length} tool step(s) · {run.events.length} event(s)
                  </span>
                </div>

                {run.steps.length === 0 ? (
                  <p className="px-4 py-6 text-xs text-muted-foreground">No tool ran in this turn.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {run.steps.map((step) => (
                      <details key={step.id} className="group">
                        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 hover:bg-muted/40 [&::-webkit-details-marker]:hidden">
                          <ChevronRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                          <span className="font-mono text-[10px] text-muted-foreground">{String(step.index).padStart(2, "0")}</span>
                          <span className="truncate font-mono text-xs text-primary">{step.tool}</span>
                          {step.paid && (
                            <span className="inline-flex items-center gap-1 border border-primary/30 px-1.5 py-0.5 font-mono text-[9px] uppercase text-primary">
                              <Lock className="size-2.5" /> {step.cost}
                            </span>
                          )}
                          <span className="ml-auto flex shrink-0 items-center gap-2 font-mono text-[10px] text-muted-foreground">
                            <span>{msLabel(step.durationMs)}</span>
                            {step.error ? (
                              <span className="text-destructive">failed</span>
                            ) : step.denied ? (
                              <span className="text-foreground/70">denied</span>
                            ) : (
                              <span className="text-primary">ok</span>
                            )}
                          </span>
                        </summary>
                        <div className="flex flex-col gap-3 border-t border-border bg-background/60 px-4 py-3">
                          <JsonBlock label="Input" value={step.args} />
                          <JsonBlock label="Output" value={step.result} />
                          <PaymentReceipt result={step.result} />
                        </div>
                      </details>
                    ))}
                  </div>
                )}

                <details className="group border-t border-border">
                  <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 font-mono text-[10px] tracking-wider uppercase text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
                    <ChevronRight className="size-3.5 transition-transform group-open:rotate-90" /> Event log
                    <span className="ml-auto">{run.events.length}</span>
                  </summary>
                  <ol className="max-h-80 overflow-y-auto scrollbar-thin border-t border-border">
                    {run.events.map((event) => (
                      <li key={event.seq} className="flex items-start gap-2.5 px-4 py-2">
                        <span className={cn("mt-1.5 size-1.5 shrink-0", eventTone(event.type))} aria-hidden />
                        <span className="w-14 shrink-0 font-mono text-[9px] text-muted-foreground">{timeOf(event.at)}</span>
                        <span className="min-w-0 text-[11px] leading-relaxed text-foreground/80">
                          <span className="mr-2 font-mono text-[9px] uppercase text-muted-foreground">{event.type}</span>
                          {event.message}
                        </span>
                      </li>
                    ))}
                  </ol>
                </details>
              </section>
            </>
          )}
        </div>

        {/* right rail */}
        <aside className="flex min-w-0 flex-col gap-4">
          <section className="surface p-4" aria-labelledby="run-limits">
            <h2 id="run-limits" className="flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] uppercase">
              <ShieldCheck className="size-3.5 text-primary" /> Run boundaries
            </h2>
            <dl className="mt-3 flex flex-col gap-2.5 text-[11px]">
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted-foreground">Spend cap</dt>
                <dd className="text-right font-mono">{runtime?.spending.perRunUsdc.toFixed(2) ?? "0.25"} USDC</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted-foreground">Approval</dt>
                <dd className="text-right font-mono">single-use · 5 min</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted-foreground">Network</dt>
                <dd className="text-right font-mono text-primary">Base Sepolia</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted-foreground">History</dt>
                <dd className="text-right font-mono">this browser</dd>
              </div>
            </dl>
            <p className="mt-3 border-t border-border pt-2.5 text-[10px] leading-relaxed text-muted-foreground">
              Approvals are held server-side and consumed once. A denied or expired approval can never run a paid tool.
            </p>
          </section>

          <WalletCard refreshKey={walletRefresh} />

          <section className="surface" aria-labelledby="history-heading">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 id="history-heading" className="flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] uppercase">
                <History className="size-3.5" /> Run history
              </h2>
              {runs.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    clearRuns();
                    clearPending();
                    setRuns([]);
                  }}
                  className="inline-flex items-center gap-1 font-mono text-[9px] uppercase text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3" /> Clear
                </button>
              )}
            </div>
            <p className="px-4 pt-2 font-mono text-[9px] tracking-wider uppercase text-muted-foreground">
              Stored in this browser only — not account synced
            </p>
            {runs.length === 0 ? (
              <p className="px-4 py-5 text-xs leading-relaxed text-muted-foreground">
                Finished runs will appear here. Nothing leaves this browser.
              </p>
            ) : (
              <ul className="mt-2 max-h-72 divide-y divide-border overflow-y-auto scrollbar-thin">
                {runs.map((item) => (
                  <li key={item.runId}>
                    <button
                      type="button"
                      onClick={() => {
                        setRun(item);
                        setError(null);
                        setNotice(null);
                      }}
                      className={cn(
                        "flex w-full flex-col gap-1 px-4 py-3 text-left hover:bg-muted/40",
                        run?.runId === item.runId && "bg-muted/50"
                      )}
                    >
                      <span className="line-clamp-2 text-[11px] leading-snug text-foreground/85">{item.mission}</span>
                      <span className="flex items-center gap-2 font-mono text-[9px] uppercase text-muted-foreground">
                        <Clock className="size-2.5" /> {timeOf(item.startedAt)}
                        <span>· {item.mode}</span>
                        <span className={item.status === "pending" ? "text-primary" : ""}>· {item.status}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="border border-border p-4">
            <h2 className="flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] uppercase">
              <Wallet className="size-3.5 text-primary" /> Runtime
            </h2>
            <ul className="mt-3 flex flex-col gap-2 font-mono text-[10px] uppercase text-muted-foreground">
              <li className="flex items-center justify-between gap-3">
                <span>Model</span>
                <span className="truncate text-right text-foreground/80">{runtime?.model ?? "checking…"}</span>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span>API key</span>
                <span className={runtime?.ready ? "text-primary" : "text-muted-foreground"}>
                  {runtime ? (runtime.ready ? "present" : "missing") : "—"}
                </span>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span>Facilitator</span>
                <span className="text-foreground/80">{runtime ? (runtime.facilitatorConfigured ? "configured" : "missing") : "—"}</span>
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

function ApprovalPanel({
  run,
  now,
  deciding,
  onDecision,
}: {
  run: RunResult;
  now: number;
  deciding: "approved" | "deny" | null;
  onDecision: (decision: "approved" | "deny") => void;
}) {
  const approval = run.pending!;
  const remaining = Math.max(0, Date.parse(approval.expiresAt) - now);
  const minutes = Math.floor(remaining / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);
  const expired = remaining <= 0;

  return (
    <section className="receipt border-signal" aria-labelledby="approval-heading">
      <div className="receipt-edge" aria-hidden />
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-foreground px-4 py-3">
        <h2 id="approval-heading" className="flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.14em] uppercase text-signal">
          <Lock className="size-3.5" /> Payment approval required
        </h2>
        <span className={cn("font-mono text-[10px] uppercase", expired ? "text-destructive" : "text-muted-foreground")}>
          {expired ? "expired — start again" : `expires in ${minutes}:${String(seconds).padStart(2, "0")}`}
        </span>
      </div>

      <div className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">{approval.reason}</p>
          <span className="stamp">Authorization required</span>
        </div>

        <div className="mt-3 divide-y divide-foreground/25 border border-foreground/40 bg-background">
          {approval.calls.map((call) => (
            <div key={call.id || call.tool} className="p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-xs text-foreground">{call.tool}</p>
                <span className="font-mono text-xs text-signal">{call.cost}</span>
              </div>
              <pre className="mt-2 max-h-28 overflow-auto scrollbar-thin whitespace-pre-wrap break-all font-mono text-[10px] text-muted-foreground">
                {JSON.stringify(call.args ?? {}, null, 2)}
              </pre>
            </div>
          ))}
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-3 font-mono text-[10px] uppercase sm:grid-cols-4">
          <div>
            <dt className="text-muted-foreground">Total</dt>
            <dd className="mt-0.5 text-foreground">{approval.totalUsdc.toFixed(2)} USDC</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Network</dt>
            <dd className="mt-0.5 text-foreground">Base Sepolia</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Run cap</dt>
            <dd className="mt-0.5 text-foreground">{approval.budgetUsdc.toFixed(2)} USDC</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Network type</dt>
            <dd className="mt-0.5 font-semibold text-signal">Testnet</dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onDecision("approved")}
            disabled={Boolean(deciding) || expired}
            className="inline-flex items-center gap-2 bg-primary px-4 py-2.5 font-mono text-[10px] font-semibold tracking-[0.12em] uppercase text-primary-foreground transition-colors hover:bg-foreground disabled:opacity-50"
          >
            {deciding === "approved" ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
            Approve &amp; pay {approval.totalUsdc.toFixed(2)} USDC
          </button>
          <button
            type="button"
            onClick={() => onDecision("deny")}
            disabled={Boolean(deciding) || expired}
            className="inline-flex items-center gap-2 border border-foreground px-4 py-2.5 font-mono text-[10px] tracking-[0.12em] uppercase text-foreground hover:border-destructive hover:text-destructive disabled:opacity-50"
          >
            {deciding === "deny" ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
            Deny — run free only
          </button>
        </div>
        <p className="mt-2 font-mono text-[9px] leading-relaxed tracking-wide uppercase text-muted-foreground">
          Approving authorizes this exact call only. Denial never executes the paid tool.
        </p>
      </div>
    </section>
  );
}

function JsonBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <p className="mb-1 font-mono text-[9px] tracking-wider uppercase text-muted-foreground">{label}</p>
      <pre className="max-h-60 overflow-auto scrollbar-thin whitespace-pre-wrap break-all border border-border bg-background p-2.5 font-mono text-[10px] leading-relaxed text-foreground/80">
        {JSON.stringify(value ?? null, null, 2)}
      </pre>
    </div>
  );
}

function PaymentReceipt({ result }: { result: unknown }) {
  const payment = (result as { payment?: { txHash?: string; amount?: string; explorer?: string } } | null)?.payment;
  if (!payment?.txHash) return null;
  const href = payment.explorer ?? `https://sepolia.basescan.org/tx/${payment.txHash}`;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border border-primary/40 bg-primary/5 px-3 py-2">
      <span className="font-mono text-[10px] uppercase text-primary">Settled {payment.amount}</span>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground hover:text-primary"
      >
        {payment.txHash.slice(0, 10)}… <ExternalLink className="size-2.5" />
      </a>
    </div>
  );
}
