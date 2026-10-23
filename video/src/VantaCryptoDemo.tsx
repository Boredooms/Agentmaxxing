import type { ReactNode } from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
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

export const CRYPTO_DURATIONS = {
  hook: 225,
  wallet: 315,
  approval: 330,
  settle: 310,
  proof: 270,
  end: 285,
} as const;

export const CRYPTO_TOTAL_FRAMES =
  CRYPTO_DURATIONS.hook +
  CRYPTO_DURATIONS.wallet +
  CRYPTO_DURATIONS.approval +
  CRYPTO_DURATIONS.settle +
  CRYPTO_DURATIONS.proof +
  CRYPTO_DURATIONS.end;

const START = {
  hook: 0,
  wallet: CRYPTO_DURATIONS.hook,
  approval: CRYPTO_DURATIONS.hook + CRYPTO_DURATIONS.wallet,
  settle: CRYPTO_DURATIONS.hook + CRYPTO_DURATIONS.wallet + CRYPTO_DURATIONS.approval,
  proof:
    CRYPTO_DURATIONS.hook +
    CRYPTO_DURATIONS.wallet +
    CRYPTO_DURATIONS.approval +
    CRYPTO_DURATIONS.settle,
  end:
    CRYPTO_DURATIONS.hook +
    CRYPTO_DURATIONS.wallet +
    CRYPTO_DURATIONS.approval +
    CRYPTO_DURATIONS.settle +
    CRYPTO_DURATIONS.proof,
};

const TX = "0x9b376282b627a2d8cadb0a05a770dbbedfa16dfe9b670a8c8802784c7a7352f9";
const TX_SHORT = "0x9b376282…52f9";
const WALLET = "0xDa83…bAfe";
const BLOCK = "49,311,297";
const GAS = "85,788";
const EXPLORER = "sepolia.basescan.org/tx/0x9b376282…52f9";

function Narration({ file }: { file: string }) {
  return (
    <Sequence from={9}>
      <Audio src={staticFile(`audio/crypto/${file}`)} />
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

function DataRow({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "180px 1fr",
        gap: 18,
        padding: "14px 0",
        borderTop: `1px solid ${C.line}`,
      }}
    >
      <span
        style={{
          fontFamily: FONT.mono,
          fontSize: 14,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: C.muted,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: FONT.mono,
          fontSize: 18,
          lineHeight: 1.35,
          letterSpacing: 0.2,
          color: accent ? C.orange : C.ink,
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function HookScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const figure = spring({ frame: frame - 16, fps, config: { damping: 200, stiffness: 80, mass: 0.9 } });
  const figureOpacity = interpolate(figure, [0, 1], [0, 1], clamp);
  const figureY = interpolate(figure, [0, 1], [42, 0], clamp);

  return (
    <Scene>
      <AbsoluteFill style={{ background: C.bone }}>
        <PaperGrid />
        <TopBar index={1} label="THE WALLET" />
        <div style={{ position: "absolute", left: 96, top: 118, width: 940 }}>
          <Reveal delay={0}>
            <Kicker>Week 3 / Crypto capability</Kicker>
          </Reveal>
          <Reveal delay={7} distance={38}>
            <h1
              style={{
                margin: "28px 0 0",
                fontFamily: FONT.display,
                fontWeight: 800,
                fontSize: 108,
                lineHeight: 0.86,
                letterSpacing: -5.4,
                color: C.ink,
              }}
            >
              It has a wallet.
              <br />
              <span style={{ color: C.cobalt }}>Now give it</span>
              <br />
              <span style={{ color: C.cobalt }}>a job.</span>
            </h1>
          </Reveal>
          <Reveal delay={26}>
            <p
              style={{
                margin: "28px 0 0",
                maxWidth: 760,
                fontFamily: FONT.body,
                fontSize: 26,
                lineHeight: 1.45,
                color: C.muted,
              }}
            >
              VANTA holds testnet USDC on Base Sepolia — and stops for a human approval before it spends a single cent.
            </p>
          </Reveal>
          <Reveal delay={40}>
            <div
              style={{
                display: "flex",
                gap: 32,
                marginTop: 38,
                paddingTop: 18,
                borderTop: `2px solid ${C.ink}`,
                fontFamily: FONT.mono,
                fontSize: 15,
                letterSpacing: 1.8,
                textTransform: "uppercase",
                color: C.muted,
              }}
            >
              <span style={{ color: C.cobalt }}>{WALLET}</span>
              <span>18.87 USDC</span>
              <span style={{ color: C.orange }}>Base Sepolia</span>
            </div>
          </Reveal>

          <Reveal delay={54}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginTop: 56,
                fontFamily: FONT.mono,
                fontSize: 13,
                letterSpacing: 1.8,
                textTransform: "uppercase",
                color: C.muted,
              }}
            >
              {["Wallet", "Approve", "Settle", "Receipt"].map((item, index) => (
                <span key={item} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{ color: index === 2 ? C.orange : C.ink }}>{item}</span>
                  {index < 3 ? <span style={{ color: C.orange }}>→</span> : null}
                </span>
              ))}
            </div>
          </Reveal>
        </div>

        <div
          style={{
            position: "absolute",
            right: 86,
            top: 274,
            width: 730,
            opacity: figureOpacity,
            translate: `0px ${figureY}px`,
          }}
        >
          <Figure
            src="images/crypto-wallet-before-top.png"
            label="Agent wallet / live read"
            style={{ width: 730 }}
            shadow={C.cobalt}
            rotate={-1.4}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 22 }}>
            <Stamp rotate={3} style={{ fontSize: 18, padding: "9px 14px" }}>
              0.01 USDC per call
            </Stamp>
          </div>
        </div>

        <Caption text="VANTA has a wallet: testnet USDC on Base Sepolia, and a human approval before every paid call." />
        <Narration file="crypto-01.wav" />
      </AbsoluteFill>
    </Scene>
  );
}

function WalletScene() {
  return (
    <Scene>
      <AbsoluteFill style={{ background: C.paper }}>
        <PaperGrid />
        <TopBar index={2} label="THE ACCOUNT" />
        <div style={{ position: "absolute", left: 96, top: 112, width: 760 }}>
          <Reveal delay={0}>
            <Kicker>01 / The account</Kicker>
          </Reveal>
          <Reveal delay={8} distance={36}>
            <h1
              style={{
                margin: "24px 0 0",
                fontFamily: FONT.display,
                fontWeight: 800,
                fontSize: 88,
                lineHeight: 0.9,
                letterSpacing: -4.2,
                color: C.ink,
              }}
            >
              A real testnet
              <br />
              <span style={{ color: C.cobalt }}>account.</span>
            </h1>
          </Reveal>
          <Reveal delay={22}>
            <p
              style={{
                margin: "22px 0 0",
                maxWidth: 660,
                fontFamily: FONT.body,
                fontSize: 24,
                lineHeight: 1.45,
                color: C.muted,
              }}
            >
              An address on Base Sepolia. Testnet ETH for gas. Testnet USDC for work. There is no mainnet path in this
              build.
            </p>
          </Reveal>

          <Reveal delay={34}>
            <div style={{ marginTop: 28, borderBottom: `1px solid ${C.line}` }}>
              <DataRow label="Address" value={WALLET} />
              <DataRow label="ETH / gas" value="0.0060 ETH" />
              <DataRow label="USDC / spend" value="18.87 USDC" accent />
              <DataRow label="Network" value="Base Sepolia · testnet" />
            </div>
          </Reveal>
        </div>

        <div style={{ position: "absolute", right: 82, top: 268, width: 880 }}>
          <Reveal delay={14} distance={44}>
            <Figure
              src="images/crypto-wallet-before-top.png"
              label="Agent wallet / before the run"
              style={{ width: 880 }}
              shadow={C.orange}
              rotate={1.2}
            />
          </Reveal>
          <Reveal delay={34} style={{ display: "flex", justifyContent: "flex-end", marginTop: 22 }}>
            <Stamp rotate={-2}>No mainnet path</Stamp>
          </Reveal>
        </div>

        <Caption text="A real testnet account: ETH for gas, USDC for work, and no mainnet path." />
        <Narration file="crypto-02.wav" />
      </AbsoluteFill>
    </Scene>
  );
}

function ApprovalScene() {
  return (
    <Scene>
      <AbsoluteFill style={{ background: C.ink }}>
        <PaperGrid dark />
        <TopBar index={3} label="THE APPROVAL" dark />
        <div style={{ position: "absolute", left: 78, top: 108, width: 620 }}>
          <Reveal delay={0}>
            <Kicker style={{ color: "#FF8A66" }}>02 / The gate</Kicker>
          </Reveal>
          <Reveal delay={8} distance={36}>
            <h1
              style={{
                margin: "22px 0 0",
                fontFamily: FONT.display,
                fontWeight: 800,
                fontSize: 92,
                lineHeight: 0.88,
                letterSpacing: -4.6,
                color: C.paper,
              }}
            >
              The loop
              <br />
              <span style={{ color: C.orange }}>stops.</span>
            </h1>
          </Reveal>
          <Reveal delay={22}>
            <p
              style={{
                margin: "22px 0 0",
                maxWidth: 540,
                fontFamily: FONT.body,
                fontSize: 24,
                lineHeight: 1.45,
                color: "rgba(247,243,234,0.72)",
              }}
            >
              VANTA selects <span style={{ color: C.paper }}>get_weather</span> and holds the call. The approval names
              the exact tool, price and network.
            </p>
          </Reveal>

          <Reveal delay={38}>
            <div
              style={{
                marginTop: 28,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 18,
                fontFamily: FONT.mono,
                textTransform: "uppercase",
              }}
            >
              {[
                ["Tool", "get_weather"],
                ["Price", "0.01 USDC"],
                ["Network", "Base Sepolia"],
                ["Decision", "Human"],
              ].map(([label, value]) => (
                <div key={label} style={{ borderTop: "1px solid rgba(247,243,234,0.22)", paddingTop: 10 }}>
                  <p style={{ margin: 0, fontSize: 12, letterSpacing: 2, color: "#FF8A66" }}>{label}</p>
                  <p style={{ margin: "5px 0 0", fontSize: 16, letterSpacing: 0.4, color: C.paper }}>{value}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        <div style={{ position: "absolute", right: 66, top: 92 }}>
          <Stamp rotate={5} style={{ color: C.paper, borderColor: C.paper, boxShadow: `inset 0 0 0 1px ${C.paper}` }}>
            Single use / 5 min
          </Stamp>
        </div>

        <div style={{ position: "absolute", left: 700, top: 300, width: 1150 }}>
          <Reveal delay={12} distance={42}>
            <Figure
              src="images/crypto-approval.png"
              label="Payment approval / the exact call"
              style={{ width: 1150 }}
              shadow={C.orange}
              rotate={-0.5}
            />
          </Reveal>
        </div>

        <div
          style={{
            position: "absolute",
            left: 78,
            bottom: 168,
            fontFamily: FONT.mono,
            fontSize: 15,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: C.orange,
          }}
        >
          Deny → the paid tool never runs
        </div>

        <Caption
          dark
          text="Ask for Mumbai weather. The exact call, price and network. Nothing runs until you approve."
        />
        <Narration file="crypto-03.wav" />
      </AbsoluteFill>
    </Scene>
  );
}

function SettleScene() {
  const steps = [
    ["01 / Approve", "Consume the single-use id once."],
    ["02 / Verify", "EIP-3009 signature + on-chain nonce."],
    ["03 / Settle", "Testnet USDC on Base Sepolia."],
  ] as const;

  return (
    <Scene>
      <AbsoluteFill style={{ background: C.bone }}>
        <PaperGrid />
        <TopBar index={4} label="THE SETTLEMENT" />
        <div style={{ position: "absolute", left: 82, top: 104, width: 600 }}>
          <Reveal delay={0}>
            <Kicker>03 / x402</Kicker>
          </Reveal>
          <Reveal delay={8} distance={36}>
            <h1
              style={{
                margin: "22px 0 0",
                fontFamily: FONT.display,
                fontWeight: 800,
                fontSize: 92,
                lineHeight: 0.88,
                letterSpacing: -4.6,
                color: C.ink,
              }}
            >
              One click.
              <br />
              <span style={{ color: C.cobalt }}>One receipt.</span>
            </h1>
          </Reveal>
          <Reveal delay={22}>
            <p
              style={{
                margin: "20px 0 0",
                maxWidth: 520,
                fontFamily: FONT.body,
                fontSize: 23,
                lineHeight: 1.45,
                color: C.muted,
              }}
            >
              The browser does not hold the resumable turn. The server consumes the approval, verifies the x402
              payment, and writes the settlement into the trace.
            </p>
          </Reveal>

          <div style={{ marginTop: 24 }}>
            {steps.map(([label, body], index) => (
              <Reveal key={label} delay={38 + index * 9}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "166px 1fr",
                    gap: 16,
                    padding: "13px 0",
                    borderTop: `1px solid ${C.line}`,
                  }}
                >
                  <span
                    style={{
                      fontFamily: FONT.mono,
                      fontSize: 14,
                      letterSpacing: 1.8,
                      textTransform: "uppercase",
                      color: index === 2 ? C.orange : C.cobalt,
                    }}
                  >
                    {label}
                  </span>
                  <span style={{ fontFamily: FONT.body, fontSize: 20, lineHeight: 1.35, color: C.ink }}>{body}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <div style={{ position: "absolute", right: 74, top: 168, width: 1130 }}>
          <Reveal delay={8} distance={44}>
            <div
              style={{
                border: `2px solid ${C.ink}`,
                background: C.paper,
                boxShadow: `14px 14px 0 ${C.cobalt}`,
                padding: "26px 30px 24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 20,
                  paddingBottom: 16,
                  borderBottom: `2px solid ${C.ink}`,
                }}
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontFamily: FONT.mono,
                      fontSize: 13,
                      letterSpacing: 2.2,
                      textTransform: "uppercase",
                      color: C.muted,
                    }}
                  >
                    Settlement receipt / Base Sepolia
                  </p>
                  <p
                    style={{
                      margin: "8px 0 0",
                      fontFamily: FONT.display,
                      fontSize: 56,
                      fontWeight: 800,
                      lineHeight: 0.9,
                      letterSpacing: -2.2,
                      color: C.orange,
                    }}
                  >
                    Settled 0.01 USDC
                  </p>
                </div>
                <Stamp rotate={4} color={C.cobalt} style={{ fontSize: 17, padding: "8px 12px" }}>
                  On-chain
                </Stamp>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0 28px",
                  marginTop: 8,
                }}
              >
                {[
                  ["TX hash", TX_SHORT],
                  ["Block", BLOCK],
                  ["Status", "0x1 · success"],
                  ["Gas used", GAS],
                  ["Tool", "get_weather"],
                  ["Network", "Base Sepolia"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 14,
                      padding: "11px 0",
                      borderBottom: `1px dotted ${C.line}`,
                      fontFamily: FONT.mono,
                      textTransform: "uppercase",
                    }}
                  >
                    <span style={{ fontSize: 12, letterSpacing: 1.6, color: C.muted }}>{label}</span>
                    <span style={{ fontSize: 14, letterSpacing: 0.5, color: label === "Status" ? C.orange : C.ink }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 18, border: `1px solid ${C.line}`, overflow: "hidden" }}>
                <Img
                  src={staticFile("images/crypto-receipt-settled.png")}
                  style={{ width: "100%", display: "block" }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 20,
                  marginTop: 14,
                  fontFamily: FONT.mono,
                  fontSize: 12,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  color: C.muted,
                }}
              >
                <span>{EXPLORER}</span>
                <Barcode style={{ width: 150, height: 18, color: C.ink }} />
              </div>
            </div>
          </Reveal>
        </div>

        <Caption text="The approval is consumed once. x402 verifies the payment. Base Sepolia settles it. The trace keeps the hash." />
        <Narration file="crypto-04.wav" />
      </AbsoluteFill>
    </Scene>
  );
}

function ProofScene() {
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
        <TopBar index={5} label="ON-CHAIN" dark />
        <div style={{ position: "absolute", left: 92, top: 112, width: 650 }}>
          <Reveal delay={0}>
            <Kicker style={{ color: "rgba(247,243,234,0.68)" }}>04 / The proof</Kicker>
          </Reveal>
          <Reveal delay={8} distance={38}>
            <h1
              style={{
                margin: "24px 0 0",
                fontFamily: FONT.display,
                fontWeight: 800,
                fontSize: 86,
                lineHeight: 0.86,
                letterSpacing: -4.2,
                color: C.paper,
              }}
            >
              18.87
              <span style={{ color: C.orange }}> → </span>
              18.86
            </h1>
          </Reveal>
          <Reveal delay={18}>
            <p
              style={{
                margin: "16px 0 0",
                fontFamily: FONT.mono,
                fontSize: 18,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: "rgba(247,243,234,0.7)",
              }}
            >
              testnet USDC / one cent moved
            </p>
          </Reveal>
          <Reveal delay={28}>
            <p
              style={{
                margin: "26px 0 0",
                maxWidth: 580,
                fontFamily: FONT.body,
                fontSize: 24,
                lineHeight: 1.45,
                color: "rgba(247,243,234,0.82)",
              }}
            >
              The wallet balance moved by exactly 0.01 USDC. The Base Sepolia transaction succeeded at block{" "}
              {BLOCK}.
            </p>
          </Reveal>

          <Reveal delay={44}>
            <div
              style={{
                marginTop: 30,
                paddingTop: 16,
                borderTop: "1px solid rgba(247,243,234,0.28)",
                fontFamily: FONT.mono,
                fontSize: 13,
                lineHeight: 1.9,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                color: "rgba(247,243,234,0.62)",
              }}
            >
              <div>Tx / {TX_SHORT}</div>
              <div>Explorer / {EXPLORER}</div>
              <div style={{ color: C.orange }}>Status / 0x1 · success</div>
            </div>
          </Reveal>
        </div>

        <div style={{ position: "absolute", right: 110, top: 148, width: 760 }}>
          <Reveal delay={12} distance={30}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
                <span
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 14,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    color: "rgba(247,243,234,0.65)",
                  }}
                >
                  Agent wallet / before
                </span>
                <span style={{ fontFamily: FONT.mono, fontSize: 16, color: C.paper }}>18.87 USDC</span>
              </div>
              <div style={{ marginTop: 8, border: "2px solid rgba(247,243,234,0.45)", overflow: "hidden" }}>
                <Img src={staticFile("images/crypto-wallet-before-top.png")} style={{ width: "100%", display: "block" }} />
              </div>
            </div>
          </Reveal>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              margin: "2px 0 16px",
              fontFamily: FONT.mono,
              fontSize: 14,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: C.orange,
            }}
          >
            <span style={{ width: 54, height: 3, background: C.orange }} />
            − 0.01 USDC · settled
          </div>

          <Reveal delay={26} distance={30}>
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
                <span
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 14,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    color: "rgba(247,243,234,0.65)",
                  }}
                >
                  Agent wallet / after
                </span>
                <span style={{ fontFamily: FONT.mono, fontSize: 16, color: C.orange }}>18.86 USDC</span>
              </div>
              <div style={{ marginTop: 8, border: "2px solid rgba(247,243,234,0.45)", overflow: "hidden" }}>
                <Img src={staticFile("images/crypto-wallet-after-top.png")} style={{ width: "100%", display: "block" }} />
              </div>
            </div>
          </Reveal>
        </div>

        <Caption dark text="18.87 to 18.86 USDC. A real 0.01 USDC settlement on Base Sepolia." />
        <Narration file="crypto-05.wav" />
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
        <div style={{ position: "absolute", left: 96, top: 178, width: 1400 }}>
          <Kicker style={{ color: "rgba(247,243,234,0.7)" }}>VANTA / Week 3 / Base Sepolia</Kicker>
          <h1
            style={{
              margin: "30px 0 0",
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 124,
              lineHeight: 0.87,
              letterSpacing: -6.2,
              color: C.paper,
            }}
          >
            Give it a job.
            <br />
            Keep the receipts.
          </h1>
          <p
            style={{
              margin: "30px 0 0",
              maxWidth: 860,
              fontFamily: FONT.body,
              fontSize: 29,
              lineHeight: 1.42,
              color: "rgba(247,243,234,0.8)",
            }}
          >
            An observable work agent with a wallet, a human approval, and a receipt you can verify.
          </p>
        </div>

        <div
          style={{
            position: "absolute",
            right: 104,
            top: 168,
            width: 168,
            height: 168,
            background: C.paper,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            rotate: "3deg",
          }}
        >
          <svg viewBox="0 0 64 64" width="132" height="132" aria-hidden="true">
            <rect width="64" height="64" fill={C.cobalt} />
            <path d="M9 12h12.5l10.5 32 10.5-32H55L38.5 54h-13L9 12Z" fill={C.paper} />
            <rect x="46" y="6" width="12" height="12" fill={C.orange} />
          </svg>
        </div>

        <div style={{ position: "absolute", left: 96, bottom: 170, width: 1728 }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 40 }}>
            <div>
              <p
                style={{
                  margin: 0,
                  fontFamily: FONT.mono,
                  fontSize: 15,
                  letterSpacing: 2.2,
                  textTransform: "uppercase",
                  color: "rgba(247,243,234,0.58)",
                }}
              >
                Repository
              </p>
              <p style={{ margin: "7px 0 0", fontFamily: FONT.mono, fontSize: 25, color: C.paper }}>
                github.com/Boredooms/Agentmaxxing
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p
                style={{
                  margin: 0,
                  fontFamily: FONT.mono,
                  fontSize: 15,
                  letterSpacing: 2.2,
                  textTransform: "uppercase",
                  color: "rgba(247,243,234,0.58)",
                }}
              >
                Crypto capability
              </p>
              <p style={{ margin: "7px 0 0", fontFamily: FONT.mono, fontSize: 25, color: C.paper }}>
                x402 · testnet USDC · human approval
              </p>
            </div>
          </div>
          <Barcode style={{ marginTop: 24, height: 28, color: "rgba(247,243,234,0.5)" }} />
        </div>

        <Caption dark text="VANTA. Give it a job. Keep the receipts." />
        <Narration file="crypto-06.wav" />
      </AbsoluteFill>
    </Scene>
  );
}

export function VantaCryptoDemo() {
  return (
    <AbsoluteFill style={{ background: C.bone }}>
      <Sequence from={START.hook} durationInFrames={CRYPTO_DURATIONS.hook} name="01 Wallet">
        <HookScene />
      </Sequence>
      <Sequence from={START.wallet} durationInFrames={CRYPTO_DURATIONS.wallet} name="02 Account">
        <WalletScene />
      </Sequence>
      <Sequence from={START.approval} durationInFrames={CRYPTO_DURATIONS.approval} name="03 Approval">
        <ApprovalScene />
      </Sequence>
      <Sequence from={START.settle} durationInFrames={CRYPTO_DURATIONS.settle} name="04 Settlement">
        <SettleScene />
      </Sequence>
      <Sequence from={START.proof} durationInFrames={CRYPTO_DURATIONS.proof} name="05 Proof">
        <ProofScene />
      </Sequence>
      <Sequence from={START.end} durationInFrames={CRYPTO_DURATIONS.end} name="06 End">
        <EndScene />
      </Sequence>
      <Progress />
    </AbsoluteFill>
  );
}
