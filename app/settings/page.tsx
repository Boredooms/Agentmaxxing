import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { SettingsPanel } from "@/components/settings-panel";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <AppShell title="Settings" eyebrow="Runtime">
      <SettingsPanel />
    </AppShell>
  );
}
