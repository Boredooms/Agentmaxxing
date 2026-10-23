"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, ExternalLink, LayoutGrid, Settings, SquareTerminal, Wrench } from "lucide-react";
import { NAV, REPO_URL } from "@/lib/nav";
import { VantaWordmark } from "@/components/brand";
import { cn } from "@/lib/utils";

const ICONS = {
  overview: LayoutGrid,
  workspace: SquareTerminal,
  tools: Wrench,
  activity: Activity,
  settings: Settings,
} as const;

const INDEX: Record<string, string> = {
  overview: "00",
  workspace: "01",
  tools: "02",
  activity: "03",
  settings: "04",
};

export function AppShell({ children, title, eyebrow }: { children: React.ReactNode; title: string; eyebrow?: string }) {
  const pathname = usePathname();
  const activeKey = NAV.find((n) => (n.href === "/" ? pathname === "/" : pathname.startsWith(n.href)))?.key ?? "overview";

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[262px_1fr]">
      <aside className="hidden border-r-2 border-foreground bg-card lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="border-b border-foreground/25 px-5 py-6">
          <VantaWordmark />
          <div className="mt-5 flex items-center justify-between border-t border-foreground/20 pt-3">
            <span className="mono-label">Run console</span>
            <span className="font-mono text-[9px] tracking-wider text-primary">v0.1</span>
          </div>
        </div>

        <nav aria-label="Primary" className="flex flex-col p-3">
          {NAV.map((item) => {
            const Icon = ICONS[item.key];
            const active = item.key === activeKey;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-3 border-b border-foreground/15 px-3 py-3 text-sm transition-colors",
                  active ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:bg-muted hover:text-foreground"
                )}
              >
                <span className={cn("font-mono text-[9px] tabular-nums", active ? "text-primary-foreground/65" : "text-muted-foreground")}>
                  {INDEX[item.key]}
                </span>
                <Icon className="size-4" strokeWidth={1.7} />
                <span className="tracking-tight">{item.label}</span>
                {active && <span className="ml-auto size-1.5 bg-signal" aria-hidden />}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-4 border-t-2 border-foreground p-5">
          <div className="flex items-center gap-2">
            <span className="size-1.5 bg-signal pulse-dot" aria-hidden />
            <span className="font-mono text-[9px] tracking-[0.14em] text-foreground uppercase">Base Sepolia · Testnet</span>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Paid tools pause for approval. Nothing moves without a decision.
          </p>
          <div className="barcode h-4 w-full text-foreground/60" aria-hidden />
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="mono-label inline-flex items-center gap-1.5 hover:text-foreground"
          >
            Source <ExternalLink className="size-3" />
          </a>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 border-b-2 border-foreground bg-background/95 backdrop-blur-md">
          <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-8">
            <div className="flex min-w-0 items-center gap-4">
              <div className="lg:hidden">
                <VantaWordmark />
              </div>
              <div className="hidden min-w-0 lg:block">
                {eyebrow && <p className="mono-label">{eyebrow}</p>}
                <h1 className="truncate font-heading text-2xl font-extrabold tracking-tight">{title}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-2 border border-foreground px-2 py-1 font-mono text-[9px] tracking-[0.12em] uppercase sm:inline-flex">
                <span className="size-1.5 bg-signal" aria-hidden /> Testnet
              </span>
              <a
                href="/workspace?new=1"
                className="inline-flex items-center gap-1.5 bg-primary px-3 py-2 font-mono text-[10px] font-semibold tracking-[0.12em] text-primary-foreground uppercase transition-colors hover:bg-foreground"
              >
                New mission
              </a>
            </div>
          </div>
          <nav aria-label="Primary mobile" className="flex gap-1 overflow-x-auto border-t border-foreground/20 px-3 py-2 lg:hidden">
            {NAV.map((item) => {
              const active = item.key === activeKey;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "shrink-0 px-3 py-1.5 font-mono text-[10px] tracking-[0.12em] uppercase",
                    active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main id="main" className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mb-6 lg:hidden">
            {eyebrow && <p className="mono-label">{eyebrow}</p>}
            <h1 className="font-heading text-3xl font-extrabold tracking-tight">{title}</h1>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
