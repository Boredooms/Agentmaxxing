import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { WorkspaceConsole } from "@/components/workspace-console";

export const metadata: Metadata = { title: "Workspace" };

export default function WorkspacePage() {
  return (
    <AppShell title="Workspace" eyebrow="Mission control">
      <WorkspaceConsole />
    </AppShell>
  );
}
