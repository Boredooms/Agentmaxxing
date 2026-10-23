"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Check, Lock, Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const SCENES = [
  {
    id: "intent",
    label: "Intent",
    title: "The request is classified before the model sees a toolbox.",
    copy: "VANTA's deterministic intent layer decides whether this mission needs a paid capability. Normal questions only ever receive free tools.",
    meta: "agent/intent.ts",
    icon: Sparkles,
    lines: [
      { text: "mission received", tone: "muted" },
      { text: "intent: research", tone: "signal" },
      { text: "free tools: available", tone: "plain" },
      { text: "paid gate: research_web unlocked", tone: "plain" },
    ],
  },
  {
    id: "plan",
    label: "Plan",
    title: "A plan appears, with states tied to real events.",
    copy: "Each item moves from queued to running to complete only when the corresponding thing actually happened. No timer theatre.",
    meta: "plan · queued → running → complete",
    icon: Check,
    lines: [
      { text: "01  classify request", tone: "muted" },
      { text: "02  search real sources", tone: "plain" },
      { text: "03  read and compare", tone: "plain" },
      { text: "04  hold paid action", tone: "signal" },
      { text: "05  cited answer", tone: "plain" },
    ],
  },
  {
    id: "tool",
    label: "Tool",
    title: "A real tool runs, and you see the payload.",
    copy: "Search and crawl calls use fixed allowlists and SSRF guards. Every step shows its arguments, result and measured duration.",
    meta: "web_search · SSRF-guarded",
    icon: Search,
    lines: [
      { text: 'web_search({ query: "agentic payments" })', tone: "plain" },
      { text: "→ 6 results returned", tone: "muted" },
      { text: "→ host allowlist enforced", tone: "muted" },
      { text: "→ sources recorded", tone: "signal" },
    ],
  },
  {
    id: "approval",
    label: "Approval",
    title: "Money is a decision, not a side effect.",
    copy: "The paid tool stops the loop. You get the exact tool, parameters, price and network — and denial always means the tool never runs.",
    meta: "Base Sepolia · TESTNET",
    icon: Lock,
    lines: [
      { text: "research_web", tone: "signal" },
      { text: "price: 0.10 USDC", tone: "plain" },
      { text: "network: Base Sepolia (testnet)", tone: "plain" },
      { text: "state: awaiting approval", tone: "muted" },
    ],
  },
  {
    id: "evidence",
    label: "Evidence",
    title: "The result carries receipts.",
    copy: "Answers are built from returned data. Sources are the exact pages that were read; settlement receipts point at the testnet explorer.",
    meta: "illustrative sample — not a live run",
    icon: Check,
    lines: [
      { text: "answer: 3 findings, 2 sources", tone: "plain" },
      { text: "source 1: example.org/overview", tone: "muted" },
      { text: "source 2: example.org/report", tone: "muted" },
      { text: "payment: testnet receipt", tone: "signal" },
    ],
  },
] as const;

export function StoryScroll() {
  const [active, setActive] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLSpanElement>(null);
  const sceneRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const index = Number((visible.target as HTMLElement).dataset.index);
          if (!Number.isNaN(index)) setActive(index);
        }
      },
      { rootMargin: "-35% 0px -35% 0px", threshold: [0.2, 0.5, 0.8] }
    );
    for (const el of sceneRefs.current) if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useGSAP(
    () => {
      gsap.registerPlugin(ScrollTrigger);
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        if (railRef.current) gsap.set(railRef.current, { scaleY: 1 });
        return;
      }
      if (!railRef.current) return;
      gsap.fromTo(
        railRef.current,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 65%",
            end: "bottom 65%",
            scrub: true,
          },
        }
      );
    },
    { scope: sectionRef }
  );

  const scene = SCENES[active];
  const Icon = scene.icon;

  return (
    <section ref={sectionRef} aria-labelledby="story-heading" className="border-b-2 border-foreground bg-[#e7dfd1]">
      <div className="mx-auto max-w-[1440px] px-4 py-16 md:px-8 md:py-24">
        <div className="mb-10 flex flex-col justify-between gap-4 border-b-2 border-foreground pb-6 md:flex-row md:items-end">
          <div>
            <p className="mono-label">02 / The run</p>
            <h2 id="story-heading" className="display-tight mt-4 max-w-2xl text-4xl md:text-6xl">
              A run has a spine.
              <br />
              <span className="text-primary">You can read it.</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Scroll the run. The trace below is an illustrative sample — the workspace shows the real thing, including
            measured durations and actual source URLs.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          {/* sticky trace panel */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="receipt relative overflow-hidden">
              <div className="receipt-edge" aria-hidden />
              <div className="relative flex items-center justify-between border-b-2 border-foreground px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="size-2 bg-signal" aria-hidden />
                  <span className="font-mono text-[10px] tracking-[0.14em] uppercase">Run receipt / {scene.label}</span>
                </div>
                <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-signal">Illustrative</span>
              </div>

              <div className="relative grid gap-6 p-5 md:p-7">
                <div className="flex items-start gap-3">
                  <span className="inline-flex size-9 shrink-0 items-center justify-center border border-foreground bg-primary text-primary-foreground">
                    <Icon className="size-4" />
                  </span>
                  <div>
                    <p className="font-heading text-xl leading-snug font-bold tracking-tight">{scene.title}</p>
                    <p className="mt-1 font-mono text-[9px] tracking-[0.12em] uppercase text-muted-foreground">{scene.meta}</p>
                  </div>
                </div>

                <div className="border border-foreground/40 bg-background p-4 font-mono text-xs">
                  <div className="mb-3 flex items-center justify-between border-b border-foreground/20 pb-2 text-[9px] tracking-[0.14em] uppercase text-muted-foreground">
                    <span>run / receipt</span>
                    <span className="text-primary">move {active + 1}/5</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {scene.lines.map((line) => (
                      <p
                        key={line.text}
                        className={cn(
                          "flex gap-2",
                          line.tone === "muted" && "text-muted-foreground",
                          line.tone === "signal" && "text-signal",
                          line.tone === "plain" && "text-foreground/85"
                        )}
                      >
                        <span className="text-muted-foreground/60">›</span>
                        <span className="break-all">{line.text}</span>
                      </p>
                    ))}
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-muted-foreground">{scene.copy}</p>

                <div className="flex gap-1.5" aria-hidden>
                  {SCENES.map((s, i) => (
                    <span
                      key={s.id}
                      className={cn("h-1 flex-1 transition-colors", i <= active ? "bg-primary" : "bg-foreground/15")}
                    />
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-3 font-mono text-[9px] tracking-[0.12em] uppercase text-muted-foreground">
              Illustration only · no payment or model call is represented here
            </p>
          </div>

          {/* scroll steps */}
          <div className="relative pl-6">
            <div className="absolute top-2 bottom-2 left-0 w-px bg-foreground/25" aria-hidden>
              <span ref={railRef} className="block h-full w-px origin-top bg-signal" />
            </div>
            <div className="flex flex-col gap-12 md:gap-20">
              {SCENES.map((s, i) => (
                <div
                  key={s.id}
                  data-index={i}
                  ref={(el) => {
                    sceneRefs.current[i] = el;
                  }}
                  className={cn("transition-opacity duration-500", active === i ? "opacity-100" : "opacity-45")}
                >
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    className="group block w-full text-left"
                    aria-pressed={active === i}
                  >
                    <p className="mono-label mb-2 flex items-center gap-2">
                      <span className={cn("inline-block size-1.5", active === i ? "bg-signal" : "bg-muted-foreground")} />
                      {String(i + 1).padStart(2, "0")} / {s.label}
                    </p>
                    <h3 className="font-heading text-2xl leading-tight font-bold tracking-tight md:text-4xl">{s.title}</h3>
                    <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">{s.copy}</p>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

