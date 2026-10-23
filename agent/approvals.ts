/**
 * SERVER-SIDE APPROVAL REGISTRY
 *
 * A paid tool may only run after the user presses Approve. The client never
 * receives the model/tool state needed to resume — it receives an opaque,
 * short-lived approval id backed by this server-side record.
 *
 * Guarantees:
 *   - the resume payload cannot be forged (client only supplies an id)
 *   - approvals are single-use (consumed before any tool executes)
 *   - approvals expire (5 minutes) and are pruned
 *   - the stored turn is re-validated on resume (tool, price, intent, budget)
 *
 * This is intentionally in-memory: it is a demo-scale, serverless-safe record
 * store with no database dependency. A multi-instance deployment should swap
 * this for a shared store — documented in the README.
 */
import { randomUUID } from "crypto";
import type { Content } from "@google/genai";
import { ApprovalError, type IntentInfo, type PlanItem, type PendingCall, type RunEvent, type RunMode, type ToolStep } from "./types.ts";

export type ApprovalRecord = {
  id: string;
  createdAt: number;
  expiresAt: number;
  consumed: boolean;
  mode: RunMode;
  runId: string;
  startedAt: string;
  mission: string;
  intent: IntentInfo;
  plan: PlanItem[];
  steps: ToolStep[];
  events: RunEvent[];
  /** The full model turn to resume; never leaves the server. */
  contents: Content[];
  calls: PendingCall[];
  /** Function responses for free/blocked calls, keyed by Gemini call id. */
  freeResponses: Record<string, unknown>;
  spentUsdc: number;
  budgetUsdc: number;
  paidApprovals: number;
  network: string;
};

type Registry = Map<string, ApprovalRecord>;

// Survive Next.js dev hot reloads without losing pending approvals.
const globalRegistry = globalThis as unknown as { __vantaApprovals?: Registry };
const registry: Registry = (globalRegistry.__vantaApprovals ??= new Map());

const TTL_MS = 5 * 60 * 1000;
const MAX_RECORDS = 200;

function prune(now = Date.now()) {
  for (const [id, rec] of registry) {
    if (rec.consumed || now > rec.expiresAt) registry.delete(id);
  }
  while (registry.size > MAX_RECORDS) {
    const oldest = registry.keys().next().value;
    if (!oldest) break;
    registry.delete(oldest);
  }
}

export function createApproval(
  input: Omit<ApprovalRecord, "id" | "createdAt" | "expiresAt" | "consumed">
): ApprovalRecord {
  prune();
  const now = Date.now();
  const record: ApprovalRecord = {
    ...input,
    id: randomUUID(),
    createdAt: now,
    expiresAt: now + TTL_MS,
    consumed: false,
  };
  registry.set(record.id, record);
  return record;
}

/** Read without consuming (used only to show expiry in diagnostics). */
export function peekApproval(id: string): ApprovalRecord | null {
  if (!/^[0-9a-f-]{30,40}$/i.test(id)) return null;
  return registry.get(id) ?? null;
}

/**
 * Atomically consume an approval. Whatever happens next — approve, deny, or a
 * crash — this id can never be used again.
 */
export function consumeApproval(id: string): ApprovalRecord {
  prune();
  if (typeof id !== "string" || !/^[0-9a-f-]{30,40}$/i.test(id)) {
    throw new ApprovalError("invalid", "Invalid approval id.");
  }
  // The strict shape check keeps malformed probes cheap; the id itself is a
  // random 122-bit UUID that is only ever issued by this server.
  const record = registry.get(id);
  if (!record) throw new ApprovalError("unknown", "This approval is unknown, expired, or already used. Start the mission again.");
  if (record.consumed) throw new ApprovalError("used", "This approval was already used. Start the mission again.");
  if (Date.now() > record.expiresAt) {
    registry.delete(id);
    throw new ApprovalError("expired", "This approval expired after 5 minutes. Start the mission again.");
  }
  record.consumed = true;
  registry.delete(id);
  return record;
}

/** Test-only: clear the registry. */
export function __clearApprovalsForTests() {
  registry.clear();
}
