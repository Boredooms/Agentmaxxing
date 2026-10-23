import type { ReactNode } from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, FONT, clamp } from "./theme";
import {
  Barcode,
  BrowserFrame,
  Caption,
  Figure,
  Kicker,
  PaperGrid,
  Progress,
  Reveal,
  Stamp,
  TopBar,
  Wipe,
} from "./ui";

export const DURATIONS = {
  hook: 216,
  plan: 405,
  trace: 342,
  approval: 450,
  evidence: 264,
  end: 228,
} as const;

export const TOTAL_FRAMES =
  DURATIONS.hook + DURATIONS.plan + DURATIONS.trace + DURATIONS.approval + DURATIONS.evidence + DURATIONS.end;

const START = {
  hook: 0,
  plan: DURATIONS.hook,
  trace: DURATIONS.hook + DURATIONS.plan,
  approval: DURATIONS.hook + DURATIONS.plan + DURATIONS.trace,
  evidence: DURATIONS.hook + DURATIONS.plan + DURATIONS.trace + DURATIONS.approval,
  end: DURATIONS.hook + DURATIONS.plan + DURATIONS.trace + DURATIONS.approval + DURATIONS.evidence,
};

function Narration({ file }: { file: string }) {
  return (
    <Sequence from={9}>
      <Audio src={staticFile(`audio/${file}`)} />
    </Sequence>
  );
}

function Scene({ children }: { children: ReactNode }) {
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {children}
      <Wipe />
    </AbsoluteFill>
  );
}

function HookScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const panel = spring({ frame: frame - 22, fps, config: { damping: 200, stiffness: 80, mass: 0.9 } });
  const panelOpacity = interpolate(panel, [0, 1], [0, 1], clamp);
  const panelY = interpolate(panel, [0, 1], [48, 0], clamp);

  return (
    <Scene>
      <AbsoluteFill style={{ background: C.bone }}>
        <PaperGrid />
        <TopBar index={1} label="THE PROBLEM" />
        <div style={{ position: "absolute", left: 96, top: 112, width: 790 }}>
          <Reveal delay={0}>
            <Kicker>An observable work agent</Kicker>
          </Reveal>
          <Reveal delay={7} distance={38}>
            <h1
              style={{
                fontFamily: FONT.display,
                fontWeight: 800,
                fontSize: 112,
                lineHeight: 0.89,
                letterSpacing: -5.2,
                color: C.ink,
                margin: "30px 0 0",
              }}
            >
              Most agents
              <br />
              ask for trust.
            </h1>
          </Reveal>
          <Reveal delay={22} distance={38}>
            <h2
              style={{
                fontFamily: FONT.display,
                fontWeight: 800,
                fontSize: 104,
                lineHeight: 0.89,
                letterSpacing: -5,
                color: C.cobalt,
                margin: "20px 0 0",
              }}
            >
              VANTA shows
              <br />
              the work.
            </h2>
          </Reveal>
          <Reveal delay={40}>
            <p
              style={{
                margin: "27px 0 0",
                maxWidth: 690,
                fontFamily: FONT.body,
                fontSize: 28,
                lineHeight: 1.4,
                color: C.muted,
              }}
            >
              A worker with tools, receipts, and boundaries. Not another chatbot.
            </p>
          </Reveal>
        </div>

        <div
          style={{
            position: "absolute",
            right: 72,
            top: 112,
            width: 900,
            opacity: panelOpacity,
            translate: `0px ${panelY}px`,
          }}
        >
          <BrowserFrame
            src="images/01-landing.png"
            label="VANTA / OVERVIEW"
            style={{ width: 900, height: 548 }}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20 }}>
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: 14,
                letterSpacing: 2.2,
                textTransform: "uppercase",
                color: C.muted,
              }}
            >
              Real product · real calls
            </span>
            <Stamp rotate={2} style={{ fontSize: 16, padding: "8px 12px" }}>
              Observable
            </Stamp>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: 96,
            bottom: 172,
            display: "flex",
            gap: 42,
            fontFamily: FONT.mono,
            fontSize: 16,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: C.muted,
          }}
        >
          {["16 tools", "13 free", "Base Sepolia", "Human approval"].map((item) => (
            <span key={item} style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ width: 7, height: 7, background: C.orange }} />
              {item}
            </span>
          ))}
        </div>

        <Caption text="Most agents ask for your trust. VANTA shows you the work." />
        <Narration file="scene-01.wav" />
      </AbsoluteFill>
    </Scene>
  );
}

const PLAN_POINTS = [
  ["INTENT", "Classified before the model sees a toolbox."],
  ["STATE", "Changes only when the corresponding work happens."],
  ["TRACE", "Arguments, payload, errors and duration."],
];

function PlanScene() {
  return (
    <Scene>
      <AbsoluteFill style={{ background: C.bone }}>
        <PaperGrid />
        <TopBar index={2} label="THE PLAN" />
        <div style={{ position: "absolute", left: 80, top: 112, width: 920 }}>
          <Kicker>01 / Plan</Kicker>
          <h1
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 92,
              lineHeight: 0.9,
              letterSpacing: -4.2,
              color: C.ink,
              margin: "20px 0 0",
            }}
          >
            A plan you
            <br />
            can audit.
          </h1>
          <p style={{ margin: "18px 0 0", maxWidth: 660, fontFamily: FONT.body, fontSize: 25, lineHeight: 1.4, color: C.muted }}>
            Classifies first. Then works through a visible checklist. No timer-driven progress bars.
          </p>
        </div>

        <div style={{ position: "absolute", right: 76, top: 112, width: 760 }}>
          {PLAN_POINTS.map(([tag, body], index) => (
            <Reveal key={tag} delay={12 + index * 10}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "140px 1fr",
                  gap: 22,
                  padding: "23px 0",
                  borderTop: `1px solid ${C.line}`,
                }}
              >
                <span
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 16,
                    letterSpacing: 2.2,
                    textTransform: "uppercase",
                    color: C.orange,
                  }}
                >
                  {tag}
                </span>
                <span style={{ fontFamily: FONT.body, fontSize: 24, lineHeight: 1.35, color: C.ink }}>{body}</span>
              </div>
            </Reveal>
          ))}
          <Reveal delay={46} style={{ marginTop: 28 }}>
            <Stamp rotate={-3}>No timer theatre</Stamp>
          </Reveal>
        </div>

        <BrowserFrame
          src="images/04-free-run.png"
          label="VANTA / WORKSPACE — LIVE RUN"
          style={{ position: "absolute", left: 80, top: 402, width: 980, height: 500 }}
          objectPosition="16% 9%"
          zoomTo={1.06}
        />

        <Caption text="Give it a mission. VANTA writes a plan, and each step changes state only when it actually happens." />
        <Narration file="scene-02.wav" />
      </AbsoluteFill>
    </Scene>
  );
}

function TraceScene() {
  return (
    <Scene>
      <AbsoluteFill style={{ background: C.paper }}>
        <PaperGrid />
        <TopBar index={3} label="THE TOOLS" />
        <div style={{ position: "absolute", left: 80, top: 110, width: 1240 }}>
          <Kicker>02 / Trace</Kicker>
          <h1
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 90,
              lineHeight: 0.9,
              letterSpacing: -4.4,
              color: C.ink,
              margin: "19px 0 0",
            }}
          >
            Every call leaves
            <br />
            <span style={{ color: C.cobalt }}>a mark.</span>
          </h1>
        </div>

        <div style={{ position: "absolute", right: 76, top: 150, width: 400, textAlign: "right" }}>
          <p style={{ margin: 0, fontFamily: FONT.mono, fontSize: 15, letterSpacing: 2, textTransform: "uppercase", color: C.muted }}>
            Measured, not invented
          </p>
          <p style={{ margin: "10px 0 0", fontFamily: FONT.display, fontSize: 68, fontWeight: 800, lineHeight: 0.9, color: C.ink }}>
            2<span style={{ color: C.orange }}> / </span>9
          </p>
          <p style={{ margin: "8px 0 0", fontFamily: FONT.mono, fontSize: 14, letterSpacing: 1.8, textTransform: "uppercase", color: C.muted }}>
            Tool steps / events
          </p>
        </div>

        <div style={{ position: "absolute", left: 80, top: 322, width: 1620 }}>
          <Reveal delay={4}>
            <Figure
              src="images/04c-trace-card.png"
              label="Execution trace / calculate_expression + convert_units"
              style={{ width: 1620 }}
            />
          </Reveal>
        </div>

        <div style={{ position: "absolute", left: 80, top: 672, width: 1500 }}>
          <Reveal delay={20}>
            <Figure src="images/04b-result-card.png" label="Result returned to the user" style={{ width: 1500 }} shadow={C.orange} />
          </Reveal>
        </div>

        <Caption text="Real tools run. You see the arguments, the payload, and the measured duration. Thirteen free tools, no wallet required." />
        <Narration file="scene-03.wav" />
      </AbsoluteFill>
    </Scene>
  );
}

const APPROVAL_NOTES = [
  ["TOOL", "get_weather"],
  ["PRICE", "0.01 USDC"],
  ["NETWORK", "Base Sepolia"],
  ["DECISION", "Human"],
];

function ApprovalScene() {
  return (
    <Scene>
      <AbsoluteFill style={{ background: C.ink }}>
        <PaperGrid dark />
        <TopBar index={4} label="THE BOUNDARY" dark />
        <div style={{ position: "absolute", left: 80, top: 96, width: 1160 }}>
          <Kicker style={{ color: "#FF8A66" }}>03 / The boundary</Kicker>
          <h1
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 88,
              lineHeight: 0.9,
              letterSpacing: -4.2,
              color: C.paper,
              margin: "18px 0 0",
            }}
          >
            When money moves,
            <br />
            <span style={{ color: C.orange }}>the loop stops.</span>
          </h1>
        </div>

        <div style={{ position: "absolute", right: 80, top: 130 }}>
          <Stamp rotate={5} style={{ color: C.paper, borderColor: C.paper, boxShadow: `inset 0 0 0 1px ${C.paper}`, fontSize: 18 }}>
            Single use / 5 min
          </Stamp>
        </div>

        <div style={{ position: "absolute", left: 66, top: 390, width: 210 }}>
          {APPROVAL_NOTES.map(([key, value], index) => (
            <Reveal key={key} delay={12 + index * 5}>
              <div style={{ marginBottom: 27 }}>
                <p style={{ margin: 0, fontFamily: FONT.mono, fontSize: 14, letterSpacing: 2.1, textTransform: "uppercase", color: "#FF8A66" }}>
                  {key}
                </p>
                <p style={{ margin: "5px 0 0", fontFamily: FONT.mono, fontSize: 17, lineHeight: 1.3, color: C.paper }}>{value}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div style={{ position: "absolute", left: 320, top: 368, width: 1280 }}>
          <Reveal delay={8} distance={40}>
            <Figure src="images/05b-approval-card.png" label="Payment approval / stored server-side" style={{ width: 1280 }} shadow={C.orange} rotate={-0.6} />
          </Reveal>
        </div>

        <div style={{ position: "absolute", right: 66, top: 390, width: 200, textAlign: "right" }}>
          {["Opaque id", "Re-validated", "Expires", "Denial = no call"].map((item, index) => (
            <Reveal key={item} delay={22 + index * 6}>
              <p
                style={{
                  margin: "0 0 24px",
                  fontFamily: FONT.mono,
                  fontSize: 14,
                  letterSpacing: 1.4,
                  textTransform: "uppercase",
                  color: index === 3 ? C.orange : "rgba(247,243,234,0.62)",
                }}
              >
                {item}
              </p>
            </Reveal>
          ))}
        </div>

        <div
          style={{
            position: "absolute",
            left: 80,
            top: 314,
            fontFamily: FONT.mono,
            fontSize: 17,
            letterSpacing: 2.2,
            textTransform: "uppercase",
            color: C.orange,
          }}
        >
          Deny → the paid tool never runs
        </div>

        <Caption
          dark
          text="When a tool costs money, the loop stops. The exact call, price, and network. A single-use approval. Deny it, and the paid tool never runs."
        />
        <Narration file="scene-04.wav" />
      </AbsoluteFill>
    </Scene>
  );
}

function EvidenceScene() {
  return (
    <Scene>
      <AbsoluteFill style={{ background: C.bone }}>
        <PaperGrid />
        <TopBar index={5} label="THE EVIDENCE" />
        <div style={{ position: "absolute", left: 80, top: 108, width: 1120 }}>
          <Kicker>04 / Evidence</Kicker>
          <h1
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 90,
              lineHeight: 0.9,
              letterSpacing: -4.4,
              color: C.ink,
              margin: "19px 0 0",
            }}
          >
            The answer carries
            <br />
            <span style={{ color: C.cobalt }}>receipts.</span>
          </h1>
        </div>

        <div style={{ position: "absolute", right: 80, top: 152 }}>
          <Stamp rotate={4}>No invented citations</Stamp>
        </div>

        <div style={{ position: "absolute", left: 80, top: 330, width: 900 }}>
          <Reveal delay={4}>
            <Figure src="images/06b-result-card.png" label="Answer / denied paid call" style={{ width: 900 }} />
          </Reveal>
        </div>

        <div style={{ position: "absolute", left: 1040, top: 330, width: 800 }}>
          <Reveal delay={16}>
            <Figure src="images/06c-sources-card.png" label="Sources returned by the tools" style={{ width: 800 }} shadow={C.orange} />
          </Reveal>
        </div>

        <div
          style={{
            position: "absolute",
            left: 80,
            top: 630,
            width: 980,
            borderTop: `2px solid ${C.ink}`,
            paddingTop: 18,
          }}
        >
          <p style={{ margin: 0, fontFamily: FONT.mono, fontSize: 14, letterSpacing: 2.2, textTransform: "uppercase", color: C.orange }}>
            Provenance
          </p>
          <p style={{ margin: "10px 0 0", fontFamily: FONT.display, fontSize: 48, fontWeight: 800, letterSpacing: -1.8, lineHeight: 1, color: C.ink }}>
            Claim → source → receipt.
          </p>
          <p style={{ margin: "10px 0 0", maxWidth: 780, fontFamily: FONT.body, fontSize: 22, lineHeight: 1.45, color: C.muted }}>
            Every URL above was returned by a tool. None is generated after the fact.
          </p>
        </div>

        <div
          style={{
            position: "absolute",
            left: 80,
            bottom: 174,
            display: "flex",
            gap: 36,
            fontFamily: FONT.mono,
            fontSize: 16,
            letterSpacing: 1.8,
            textTransform: "uppercase",
            color: C.muted,
          }}
        >
          <span>2 tool calls</span>
          <span style={{ color: C.orange }}>3 real URLs</span>
          <span>0 settlements</span>
        </div>

        <div
          style={{
            position: "absolute",
            right: 82,
            bottom: 176,
            maxWidth: 520,
            textAlign: "right",
            fontFamily: FONT.mono,
            fontSize: 14,
            lineHeight: 1.6,
            letterSpacing: 1.2,
            textTransform: "uppercase",
            color: C.muted,
          }}
        >
          Denied path shown. A testnet settlement appears only after approval.
        </div>

        <Caption text="The answer carries receipts. Real source URLs, and a testnet settlement when you approve." />
        <Narration file="scene-05.wav" />
      </AbsoluteFill>
    </Scene>
  );
}

function EndScene() {
  return (
    <Scene>
      <AbsoluteFill style={{ background: C.cobalt }}>
        <AbsoluteFill
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(247,243,234,0.09) 1px, transparent 1px), linear-gradient(to bottom, rgba(247,243,234,0.09) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <TopBar index={6} label="END OF MANUAL" dark />
        <div style={{ position: "absolute", left: 96, top: 200 }}>
          <Kicker style={{ color: "rgba(247,243,234,0.72)" }}>VANTA / v0.1 / testnet</Kicker>
          <h1
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 128,
              lineHeight: 0.88,
              letterSpacing: -6.4,
              color: C.paper,
              margin: "28px 0 0",
            }}
          >
            Give it a job.
            <br />
            Keep the receipts.
          </h1>
          <p style={{ margin: "32px 0 0", maxWidth: 840, fontFamily: FONT.body, fontSize: 30, lineHeight: 1.4, color: "rgba(247,243,234,0.78)" }}>
            Observable autonomous work, with a human decision at every payment boundary.
          </p>
        </div>

        <div
          style={{
            position: "absolute",
            right: 100,
            top: 170,
            width: 170,
            height: 170,
            background: C.paper,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            rotate: "3deg",
          }}
        >
          <svg viewBox="0 0 64 64" width="136" height="136" aria-hidden="true">
            <rect width="64" height="64" fill={C.cobalt} />
            <path d="M9 12h12.5l10.5 32 10.5-32H55L38.5 54h-13L9 12Z" fill={C.paper} />
            <rect x="46" y="6" width="12" height="12" fill={C.orange} />
          </svg>
        </div>

        <div style={{ position: "absolute", left: 96, bottom: 176, width: 1728 }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 40 }}>
            <div>
              <p style={{ margin: 0, fontFamily: FONT.mono, fontSize: 16, letterSpacing: 2.4, textTransform: "uppercase", color: "rgba(247,243,234,0.62)" }}>
                Source / demo
              </p>
              <p style={{ margin: "7px 0 0", fontFamily: FONT.mono, fontSize: 26, color: C.paper }}>
                github.com/Boredooms/Agentmaxxing
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, fontFamily: FONT.mono, fontSize: 16, letterSpacing: 2.4, textTransform: "uppercase", color: "rgba(247,243,234,0.62)" }}>
                Network
              </p>
              <p style={{ margin: "7px 0 0", fontFamily: FONT.mono, fontSize: 26, color: C.paper }}>Base Sepolia · testnet</p>
            </div>
          </div>
          <Barcode style={{ marginTop: 26, height: 30, color: "rgba(247,243,234,0.55)" }} />
        </div>

        <Caption dark text="VANTA. Give it a job. Keep the receipts." />
        <Narration file="scene-06.wav" />
      </AbsoluteFill>
    </Scene>
  );
}

export function VantaExplainer() {
  return (
    <AbsoluteFill style={{ background: C.bone }}>
      <Sequence from={START.hook} durationInFrames={DURATIONS.hook} name="01 Hook">
        <HookScene />
      </Sequence>
      <Sequence from={START.plan} durationInFrames={DURATIONS.plan} name="02 Plan">
        <PlanScene />
      </Sequence>
      <Sequence from={START.trace} durationInFrames={DURATIONS.trace} name="03 Trace">
        <TraceScene />
      </Sequence>
      <Sequence from={START.approval} durationInFrames={DURATIONS.approval} name="04 Approval">
        <ApprovalScene />
      </Sequence>
      <Sequence from={START.evidence} durationInFrames={DURATIONS.evidence} name="05 Evidence">
        <EvidenceScene />
      </Sequence>
      <Sequence from={START.end} durationInFrames={DURATIONS.end} name="06 End">
        <EndScene />
      </Sequence>
      <Progress />
    </AbsoluteFill>
  );
}
