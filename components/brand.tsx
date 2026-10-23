import Link from "next/link";
import { cn } from "@/lib/utils";

export function VantaMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("size-7", className)} aria-hidden="true">
      <rect width="64" height="64" fill="#1B2BE0" />
      <path d="M9 12h12.5l10.5 32 10.5-32H55L38.5 54h-13L9 12Z" fill="#F7F3EA" />
      <rect x="46" y="6" width="12" height="12" fill="#FF4D12" />
      <path d="M9 58h12" stroke="#F7F3EA" strokeWidth="2" />
    </svg>
  );
}

export function VantaWordmark({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("group flex items-center gap-2.5", className)} aria-label="VANTA home">
      <span className="border border-foreground p-0.5 transition-transform group-hover:-rotate-2">
        <VantaMark />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-heading text-[1.3rem] font-extrabold tracking-[0.16em] uppercase">Vanta</span>
        <span className="mt-1 font-mono text-[7px] tracking-[0.2em] text-muted-foreground uppercase">
          Observable work agent
        </span>
      </span>
    </Link>
  );
}
