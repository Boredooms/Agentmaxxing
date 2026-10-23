/**
 * Shared run model for VANTA.
 *
 * Everything the UI renders about a run comes from these types: measured
 * tool durations, server-produced events, and a plan whose states are updated
 * only when something actually happened.
 */
export type ChatMessage = { role: "user" | "agent"; text: string };

export type ToolStep = {
  id: string;
  index: number;
  tool: string;
  args: unknown;
  result: unknown;
  error?: boolean;
  denied?: boolean;
  paid: boolean;
  cost?: string;
  startedAt: string;
  durationMs: number;
};

export type RunEventType =
  | "mission"
  | "intent"
  | "plan"
  | "tool_start"
  | "tool_result"
  | "approval_requested"
  | "approval_decision"
  | "budget"
  | "policy"
  | "final"
  | "error";

export type RunEvent = {
  seq: number;
  at: string;
  type: RunEventType;
  message: string;
  tool?: string;
  ok?: boolean;
  durationMs?: number;
  amount?: string;
};

export type PlanStatus = "queued" | "running" | "complete" | "blocked" | "awaiting-approval" | "skipped";

export type PlanItem = {
  id: string;
  title: string;
  detail: string;
  status: PlanStatus;
};

export type IntentInfo = {
  label: string;
  note: string;
  paidAllowed: string[];
};

export type PendingCall = {
  id: string;
  tool: string;
  args: unknown;
  cost: string;
  priceUsdc: number;
};

export type Approval = {
  id: string;
  calls: PendingCall[];
  totalUsdc: number;
  budgetUsdc: number;
  network: string;
  reason: string;
  expiresAt: string;
};

export type RunMode = "live" | "demo";

export type RunResult = {
  status: "completed" | "pending";
  runId: string;
  mode: RunMode;
  mission: string;
  intent: IntentInfo;
  answer?: string;
  steps: ToolStep[];
  events: RunEvent[];
  plan: PlanItem[];
  pending?: Approval;
  note?: string;
  startedAt: string;
  finishedAt: string;
};

export class ApprovalError extends Error {
  code: "unknown" | "expired" | "used" | "invalid";
  status: number;
  constructor(code: ApprovalError["code"], message: string) {
    super(message);
    this.code = code;
    this.status = code === "unknown" ? 404 : 409;
  }
}
