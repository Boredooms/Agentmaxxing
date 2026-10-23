import Link from "next/link";
import { ArrowUpRight, GitBranch } from "lucide-react";
import { NAV, REPO_URL } from "@/lib/nav";
import { VantaWordmark } from "@/components/brand";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-foreground bg-background/95 backdrop-blur-md">
      <div className="border-b border-foreground/20 bg-foreground text-background">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-1.5 md:px-8">
          <span className="whitespace-nowrap font-mono text-[9px] tracking-[0.18em] uppercase">
            <span className="sm:hidden">VANTA / 001</span>
            <span className="hidden sm:inline">VANTA / Field manual 001</span>
          </span>
          <span className="hidden font-mono text-[9px] tracking-[0.18em] text-background/65 uppercase sm:block">
            Plan → call → measure → show → ask
          </span>
          <span className="whitespace-nowrap font-mono text-[8px] tracking-[0.12em] text-[#ff8a66] uppercase sm:text-[9px] sm:tracking-[0.16em]">
            Paid work requires approval
          </span>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3.5 md:px-8">
        <VantaWordmark />
        <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
          {NAV.filter((n) => n.href !== "/").map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase transition-colors hover:text-foreground"
          >
            GitHub
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-2 border border-foreground px-2.5 py-1.5 font-mono text-[9px] tracking-[0.12em] uppercase lg:inline-flex">
            <span className="size-1.5 bg-signal" aria-hidden /> Base Sepolia
          </span>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub repository"
            className="hidden border border-foreground p-2 text-foreground transition-colors hover:bg-foreground hover:text-background sm:inline-flex"
          >
            <GitBranch className="size-4" />
          </a>
          <Link
            href="/workspace"
            className="inline-flex items-center gap-1.5 bg-primary px-3.5 py-2 font-mono text-[10px] font-semibold tracking-[0.12em] text-primary-foreground uppercase transition-colors hover:bg-foreground"
          >
            Open workspace <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </div>
      <nav aria-label="Primary mobile" className="flex gap-1 overflow-x-auto border-t border-foreground/20 px-3 py-2 md:hidden">
        {NAV.filter((item) => item.href !== "/").map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="shrink-0 px-2.5 py-1 font-mono text-[10px] tracking-[0.1em] text-muted-foreground uppercase hover:text-foreground"
          >
            {item.label}
          </Link>
        ))}
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 px-2.5 py-1 font-mono text-[10px] tracking-[0.1em] text-muted-foreground uppercase hover:text-foreground"
        >
          GitHub
        </a>
      </nav>
    </header>
  );
}
