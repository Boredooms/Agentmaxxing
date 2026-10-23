import { loadFont as loadBricolage } from "@remotion/google-fonts/BricolageGrotesque";
import { loadFont as loadPublicSans } from "@remotion/google-fonts/PublicSans";
import { loadFont as loadPlexMono } from "@remotion/google-fonts/IBMPlexMono";

const display = loadBricolage("normal", { weights: ["700", "800"], subsets: ["latin"] });
const body = loadPublicSans("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });
const mono = loadPlexMono("normal", { weights: ["400", "500", "600"], subsets: ["latin"] });

export const FONT = {
  display: display.fontFamily,
  body: body.fontFamily,
  mono: mono.fontFamily,
} as const;

export const C = {
  bone: "#EDE7DB",
  paper: "#F7F3EA",
  ink: "#14161A",
  cobalt: "#1B2BE0",
  orange: "#FF4D12",
  muted: "#6A6459",
  line: "rgba(20,22,26,0.26)",
  faint: "rgba(20,22,26,0.09)",
  boneLine: "rgba(247,243,234,0.2)",
} as const;

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
