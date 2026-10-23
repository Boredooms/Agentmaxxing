import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { ActivityLedger } from "@/components/activity-ledger";

export const metadata: Metadata = { title: "Activity" };

export default function ActivityPage() {
  return (
    <AppShell title="Activity" eyebrow="Ledger">
      <ActivityLedger />
    </AppShell>
  );
}
