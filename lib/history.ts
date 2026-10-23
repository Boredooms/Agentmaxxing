/** Browser-local run history. Never claims to be account-synced or durable. */
import type { RunResult } from "@/agent/types";

export const HISTORY_KEY = "vanta.runs.v1";
export const PENDING_KEY = "vanta.pending.v1";
const MAX_RUNS = 20;

export function loadRuns(): RunResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is RunResult =>
        Boolean(r) && typeof r.runId === "string" && typeof r.mission === "string" && Array.isArray(r.steps)
    );
  } catch {
    return [];
  }
}

export function saveRun(run: RunResult): RunResult[] {
  if (typeof window === "undefined") return [];
  const runs = loadRuns().filter((r) => r.runId !== run.runId);
  const next = [run, ...runs].slice(0, MAX_RUNS);
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    // Storage can be full or blocked; history is a convenience, not a source of truth.
  }
  return next;
}

export function clearRuns(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(HISTORY_KEY);
}

export function savePending(result: RunResult): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.sessionStorage.setItem(PENDING_KEY, JSON.stringify({ result }));
    return true;
  } catch {
    return false;
  }
}

export function loadPending(): RunResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { result?: RunResult };
    return parsed?.result && parsed.result.status === "pending" ? parsed.result : null;
  } catch {
    return null;
  }
}

export function clearPending(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(PENDING_KEY);
}

export function shortAddress(address?: string | null): string {
  if (!address) return "not configured";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function durationMs(run: RunResult): number {
  const start = Date.parse(run.startedAt);
  const end = Date.parse(run.finishedAt);
  return Number.isFinite(start) && Number.isFinite(end) ? Math.max(0, end - start) : 0;
}
