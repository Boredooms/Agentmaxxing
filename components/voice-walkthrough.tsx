"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Square, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

const NARRATION = [
  "Give an agent a mission. Before the model sees a toolbox, VANTA classifies the request and decides whether paid capability is even relevant.",
  "It writes a short plan. Each item changes state only when the corresponding step actually happens — queued, running, complete, or blocked.",
  "Real tools run. You see the arguments, the returned payload, the sources, and the measured duration of every call.",
  "When a tool costs money, the loop stops. You get the exact call, price and testnet network. Approve it, or deny it — denial never runs the paid tool.",
  "The answer comes back with citations and testnet receipts. The run is saved in this browser, clearly labelled as local history.",
];

export function VoiceWalkthrough() {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [scene, setScene] = useState(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const cancelledRef = useRef(false);
  const sceneRef = useRef(0);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      cancelledRef.current = true;
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  function speak(index: number) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (index >= NARRATION.length) {
      setPlaying(false);
      setPaused(false);
      sceneRef.current = 0;
      setScene(0);
      return;
    }
    cancelledRef.current = false;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(NARRATION[index]);
    utterance.rate = 1.01;
    utterance.pitch = 1;
    const preferred = window.speechSynthesis
      .getVoices()
      .find((v) => /en-(US|GB)/i.test(v.lang) && /natural|google|samantha|daniel/i.test(v.name));
    if (preferred) utterance.voice = preferred;
    utterance.onend = () => {
      if (cancelledRef.current) return;
      const next = sceneRef.current + 1;
      if (next < NARRATION.length) speak(next);
      else {
        setPlaying(false);
        setPaused(false);
        sceneRef.current = 0;
        setScene(0);
      }
    };
    utterance.onerror = () => {
      setPlaying(false);
      setPaused(false);
    };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    sceneRef.current = index;
    setScene(index);
    setPlaying(true);
    setPaused(false);
  }

  function pause() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (paused) {
      window.speechSynthesis.resume();
      setPaused(false);
    } else {
      window.speechSynthesis.pause();
      setPaused(true);
    }
  }

  function stop() {
    cancelledRef.current = true;
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setPlaying(false);
    setPaused(false);
    sceneRef.current = 0;
    setScene(0);
  }

  return (
    <div className="sheet border-foreground/40 p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {supported === false ? <VolumeX className="size-4 text-muted-foreground" /> : <Volume2 className="size-4 text-signal" />}
          <p className="font-mono text-[10px] font-medium tracking-[0.14em] uppercase">Listen to the walkthrough</p>
        </div>
        <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-muted-foreground">
          {supported === false ? "Voice unavailable in this browser" : "Browser voice · no autoplay"}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => (playing && !paused ? pause() : playing && paused ? pause() : speak(0))}
          disabled={supported === false}
          className="inline-flex items-center gap-2 bg-primary px-3 py-2 font-mono text-[10px] font-semibold tracking-[0.12em] uppercase text-primary-foreground disabled:opacity-40"
        >
          {playing && !paused ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          {playing && !paused ? "Pause" : playing && paused ? "Resume" : "Play"}
        </button>
        <button
          type="button"
          onClick={stop}
          disabled={!playing}
          className="inline-flex items-center gap-2 border border-foreground px-3 py-2 font-mono text-[10px] tracking-[0.12em] uppercase text-foreground hover:bg-foreground hover:text-background disabled:opacity-40"
        >
          <Square className="size-3" /> Stop
        </button>
        <span className="ml-auto font-mono text-[10px] tracking-wider uppercase text-muted-foreground" aria-live="polite">
          Scene {scene + 1} / {NARRATION.length}
        </span>
      </div>

      <p
        aria-live="polite"
        className={cn(
          "mt-4 border-l-2 border-signal pl-3 text-sm leading-relaxed text-muted-foreground transition-opacity",
          !playing && "opacity-80"
        )}
      >
        {NARRATION[scene]}
      </p>

      <details className="mt-4 group">
        <summary className="cursor-pointer font-mono text-[10px] tracking-[0.14em] uppercase text-muted-foreground hover:text-foreground">
          Transcript
        </summary>
        <ol className="mt-3 flex flex-col gap-2 text-xs leading-relaxed text-muted-foreground">
          {NARRATION.map((line, i) => (
            <li key={i} className={cn("flex gap-2", i === scene && "text-foreground")}>
              <span className="font-mono text-[10px] text-signal">{String(i + 1).padStart(2, "0")}</span>
              {line}
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}
