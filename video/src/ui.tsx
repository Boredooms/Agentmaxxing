import type { CSSProperties, ReactNode } from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, FONT, clamp } from "./theme";

export function PaperGrid({ dark = false }: { dark?: boolean }) {
  const line = dark ? "rgba(247,243,234,0.07)" : "rgba(27,43,224,0.09)";
  return (
    <>
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(to right, ${line} 1px, transparent 1px), linear-gradient(to bottom, ${line} 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 64,
          width: 1,
          background: C.orange,
          opacity: dark ? 0.55 : 0.38,
        }}
      />
    </>
  );
}

export function TopBar({ index, label, dark = false }: { index: number; label: string; dark?: boolean }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 54,
        background: dark ? "#0A0B0D" : C.ink,
        color: C.paper,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 56px",
        fontFamily: FONT.mono,
        fontSize: 17,
        letterSpacing: 2.4,
        textTransform: "uppercase",
        borderBottom: `1px solid ${C.boneLine}`,
        zIndex: 20,
      }}
    >
      <span>VANTA / FIELD MANUAL 001</span>
      <span style={{ opacity: 0.62 }}>{label}</span>
      <span style={{ color: "#FF8A66" }}>SCENE {String(index).padStart(2, "0")} / 06</span>
    </div>
  );
}

export function Kicker({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        fontFamily: FONT.mono,
        fontSize: 18,
        letterSpacing: 3.2,
        textTransform: "uppercase",
        color: C.muted,
        display: "flex",
        alignItems: "center",
        gap: 12,
        ...style,
      }}
    >
      <span style={{ width: 10, height: 10, background: C.orange, display: "inline-block" }} />
      {children}
    </div>
  );
}

export function Stamp({
  children,
  rotate = -4,
  style,
  color = C.orange,
}: {
  children: ReactNode;
  rotate?: number;
  style?: CSSProperties;
  color?: string;
}) {
  return (
    <div
      style={{
        border: `3px solid ${color}`,
        boxShadow: `inset 0 0 0 1px ${color}`,
        color,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "10px 16px",
        fontFamily: FONT.mono,
        fontSize: 20,
        fontWeight: 600,
        letterSpacing: 3,
        textTransform: "uppercase",
        lineHeight: 1,
        rotate: `${rotate}deg`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Caption({
  text,
  dark = false,
  delay = 4,
}: {
  text: string;
  dark?: boolean;
  delay?: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 200, stiffness: 110 } });
  const opacity = interpolate(p, [0, 1], [0, 1], clamp);
  const translateY = interpolate(p, [0, 1], [18, 0], clamp);

  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        right: 64,
        bottom: 42,
        display: "flex",
        justifyContent: "center",
        opacity,
        translate: `0px ${translateY}px`,
        zIndex: 30,
      }}
    >
      <div
        style={{
          maxWidth: 1560,
          background: dark ? C.paper : C.ink,
          color: dark ? C.ink : C.paper,
          borderLeft: `7px solid ${C.orange}`,
          padding: "17px 24px 16px",
          fontFamily: FONT.body,
          fontSize: 30,
          lineHeight: 1.35,
          letterSpacing: -0.2,
          boxShadow: dark ? "none" : "0 0 0 1px rgba(247,243,234,0.12)",
        }}
      >
        {text}
      </div>
    </div>
  );
}

export function Progress() {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = Math.min(1, Math.max(0, frame / (durationInFrames - 1)));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 6, background: "rgba(20,22,26,0.25)", zIndex: 60 }}>
      <div style={{ width: `${progress * 100}%`, height: "100%", background: C.cobalt }} />
      <div
        style={{
          position: "absolute",
          top: -3,
          left: `calc(${progress * 100}% - 3px)`,
          width: 6,
          height: 12,
          background: C.orange,
        }}
      />
    </div>
  );
}

export function Wipe() {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [0, 10], [0, -100], clamp);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: C.orange,
        translate: `${x}% 0px`,
        zIndex: 50,
      }}
    />
  );
}

export function BrowserFrame({
  src,
  label,
  style,
  imageStyle,
  objectPosition = "center",
  zoomTo = 1.04,
}: {
  src: string;
  label: string;
  style?: CSSProperties;
  imageStyle?: CSSProperties;
  objectPosition?: string;
  zoomTo?: number;
}) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const scale = interpolate(frame, [0, durationInFrames], [1, zoomTo], clamp);

  return (
    <div
      style={{
        border: `2px solid ${C.ink}`,
        background: C.paper,
        boxShadow: `12px 12px 0 ${C.cobalt}`,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          height: 42,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          background: C.ink,
          color: C.paper,
          fontFamily: FONT.mono,
          fontSize: 13,
          letterSpacing: 2,
          textTransform: "uppercase",
        }}
      >
        <span>{label}</span>
        <span style={{ color: "#FF8A66" }}>LIVE · 1600 × 900</span>
      </div>
      <div style={{ position: "relative", flex: 1, overflow: "hidden", background: C.bone }}>
        <Img
          src={staticFile(src)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition,
            scale,
            ...imageStyle,
          }}
        />
      </div>
    </div>
  );
}

export function Figure({
  src,
  label,
  style,
  shadow = C.cobalt,
  rotate = 0,
}: {
  src: string;
  label: string;
  style?: CSSProperties;
  shadow?: string;
  rotate?: number;
}) {
  return (
    <figure style={{ margin: 0, rotate: `${rotate}deg`, ...style }}>
      <figcaption
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 9,
          fontFamily: FONT.mono,
          fontSize: 14,
          letterSpacing: 2.1,
          textTransform: "uppercase",
          color: C.muted,
        }}
      >
        <span>{label}</span>
        <span style={{ color: C.orange }}>REAL RUN</span>
      </figcaption>
      <div
        style={{
          border: `2px solid ${C.ink}`,
          boxShadow: `9px 9px 0 ${shadow}`,
          background: C.paper,
          overflow: "hidden",
        }}
      >
        <Img src={staticFile(src)} style={{ width: "100%", display: "block" }} />
      </div>
    </figure>
  );
}

export function Reveal({
  children,
  delay = 0,
  distance = 32,
  style,
}: {
  children: ReactNode;
  delay?: number;
  distance?: number;
  style?: CSSProperties;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 200, stiffness: 100, mass: 0.8 } });
  const translateY = interpolate(p, [0, 1], [distance, 0], clamp);
  return (
    <div
      style={{
        opacity: interpolate(p, [0, 1], [0, 1], clamp),
        translate: `0px ${translateY}px`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Barcode({ style }: { style?: CSSProperties }) {
  return (
    <div
      style={{
        height: 26,
        backgroundImage:
          "repeating-linear-gradient(90deg, currentColor 0, currentColor 2px, transparent 2px, transparent 5px, currentColor 5px, currentColor 6px, transparent 6px, transparent 11px, currentColor 11px, currentColor 14px, transparent 14px, transparent 17px)",
        ...style,
      }}
    />
  );
}
