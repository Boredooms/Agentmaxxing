import type { Intent, } from "./intent";
import type { PlanItem, RunEvent } from "./types";

/** The plan a user sees. States start queued and only advance on real events. */
export function initialPlan(intent: Intent, mission: string): PlanItem[] {
  const wantsPaid = intent.paidAllowed.length > 0;
  return [
    {
      id: "intent",
      title: "Classify the request",
      detail: `Intent: ${intent.label}. ${intent.note}.`,
      status: "complete",
    },
    {
      id: "execute",
      title: "Plan and run tools",
      detail: /research|sources|compare|briefing/i.test(mission)
        ? "Search for real sources, run the selected tools and collect evidence."
        : "Select the tools this mission needs and run them with measured inputs and outputs.",
      status: "running",
    },
    {
      id: "approval",
      title: "Hold paid work for approval",
      detail: "Paid tools stay blocked until you approve the exact call, price and network.",
      status: wantsPaid ? "queued" : "skipped",
    },
    {
      id: "answer",
      title: "Compose the answer",
      detail: "Synthesize only from returned data, with sources where available.",
      status: "queued",
    },
  ];
}

export function updatePlan(
  plan: PlanItem[],
  id: string,
  status: PlanItem["status"],
  detail?: string
): void {
  const item = plan.find((p) => p.id === id);
  if (!item) return;
  item.status = status;
  if (detail) item.detail = detail;
}

export function applyPlanEvents(plan: PlanItem[], events: RunEvent[]): PlanItem[] {
  for (const e of events) {
    if (e.type === "tool_start") {
      const item = plan.find((p) => p.id === "execute");
      if (item) item.status = "running";
    }
    if (e.type === "approval_requested") {
      const item = plan.find((p) => p.id === "approval");
      if (item) item.status = "awaiting-approval";
    }
    if (e.type === "final") {
      const item = plan.find((p) => p.id === "execute");
      if (item && item.status !== "blocked") item.status = "complete";
      const answer = plan.find((p) => p.id === "answer");
      if (answer) answer.status = "complete";
    }
  }
  return plan;
}
