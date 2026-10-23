/** Shared, server-side recorder for a single VANTA run. */
import { randomUUID } from "crypto";
import type { Intent } from "./intent";
import { initialPlan, updatePlan } from "./plan";
import type {
  IntentInfo,
  PlanItem,
  RunEvent,
  RunEventType,
  RunMode,
  ToolStep,
} from "./types";

export const NETWORK_LABEL = "Base Sepolia · TESTNET";

export function parseUsdc(cost?: string): number {
  if (!cost) return 0;
  const match = cost.match(/([0-9]*\.?[0-9]+)/);
  return match ? Number(match[1]) : 0;
}

export function runBudgetUsdc(): number {
  const raw = Number(process.env.MAX_RUN_SPEND_USDC ?? "0.25");
  return Number.isFinite(raw) && raw >= 0 ? Math.min(raw, 5) : 0.25;
}

export type Recorder = {
  runId: string;
  mode: RunMode;
  mission: string;
  intent: IntentInfo;
  plan: PlanItem[];
  steps: ToolStep[];
  events: RunEvent[];
  spentUsdc: number;
  budgetUsdc: number;
  /** How many paid approval cards this run has already issued (max 1). */
  paidApprovals: number;
  startedAt: string;
  event: (type: RunEventType, message: string, extra?: Partial<RunEvent>) => void;
  beginStep: (tool: string, args: unknown, paid: boolean, cost?: string) => { id: string; startedAt: string; started: number };
  endStep: (
    pending: { id: string; startedAt: string; started: number },
    tool: string,
    args: unknown,
    result: unknown,
    opts: { error?: boolean; denied?: boolean; paid: boolean; cost?: string }
  ) => ToolStep;
  setPlan: (id: string, status: PlanItem["status"], detail?: string) => void;
};

export function createRecorder(input: {
  mode: RunMode;
  mission: string;
  intent: Intent;
  spentUsdc?: number;
  budgetUsdc?: number;
  paidApprovals?: number;
  runId?: string;
  startedAt?: string;
  plan?: PlanItem[];
  steps?: ToolStep[];
  events?: RunEvent[];
  /** Resume: keep existing trace without re-emitting the start events. */
  quiet?: boolean;
}): Recorder {
  const runId = input.runId ?? randomUUID();
  const plan = input.plan ?? initialPlan(input.intent, input.mission);
  const steps = input.steps ?? [];
  const events = input.events ?? [];
  const startedAt = input.startedAt ?? new Date().toISOString();

  const rec: Recorder = {
    runId,
    mode: input.mode,
    mission: input.mission,
    intent: { label: input.intent.label, note: input.intent.note, paidAllowed: input.intent.paidAllowed },
    plan,
    steps,
    events,
    spentUsdc: input.spentUsdc ?? 0,
    budgetUsdc: input.budgetUsdc ?? runBudgetUsdc(),
    paidApprovals: input.paidApprovals ?? 0,
    startedAt,
    event(type, message, extra = {}) {
      events.push({ seq: events.length + 1, at: new Date().toISOString(), type, message, ...extra });
    },
    beginStep(tool, args, paid, cost) {
      const started = Date.now();
      const id = `${tool}-${steps.length + 1}`;
      rec.event("tool_start", `Running ${tool}${paid && cost ? ` · ${cost}` : " · free"}`, { tool });
      return { id, startedAt: new Date(started).toISOString(), started };
    },
    endStep(pending, tool, args, result, opts) {
      const durationMs = Math.max(0, Date.now() - pending.started);
      const step: ToolStep = {
        id: pending.id,
        index: steps.length + 1,
        tool,
        args,
        result,
        error: Boolean(opts.error),
        denied: Boolean(opts.denied),
        paid: opts.paid,
        cost: opts.cost,
        startedAt: pending.startedAt,
        durationMs,
      };
      steps.push(step);
      rec.event("tool_result", `${tool} ${opts.error ? "failed" : "succeeded"} in ${durationMs} ms`, {
        tool,
        ok: !opts.error,
        durationMs,
      });
      return step;
    },
    setPlan(id, status, detail) {
      const before = plan.find((p) => p.id === id)?.status;
      updatePlan(plan, id, status, detail);
      if (before !== status) {
        rec.event("plan", `Plan “${id}” → ${status}`, {});
      }
    },
  };

  if (!input.quiet) {
    rec.event("mission", input.mode === "demo" ? "Mission received (demo planner)." : "Mission received — live agent.");
    rec.event("intent", `Intent: ${rec.intent.label} — ${rec.intent.note}`);
  }
  return rec;
}
