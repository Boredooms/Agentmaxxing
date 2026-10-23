import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Bricolage_Grotesque, IBM_Plex_Mono, Public_Sans } from "next/font/google";
import { cn } from "@/lib/utils";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});
const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://agentmaxxing-boredooms-projects.vercel.app"),
  title: {
    default: "VANTA — Give it a job. Keep the receipts.",
    template: "%s · VANTA",
  },
  description:
    "VANTA is an observable autonomous work agent. It plans, uses real tools, shows every step, cites evidence, and asks before spending testnet USDC.",
  applicationName: "VANTA",
  icons: { icon: "/icon.svg", apple: "/apple-icon.png" },
  openGraph: {
    title: "VANTA — Give it a job. Keep the receipts.",
    description: "A worker with tools, receipts, and boundaries. Watch every step, approve every payment.",
    type: "website",
    images: [{ url: "/brand/vanta-og.png", width: 1200, height: 630, alt: "VANTA — Give it a job. Keep the receipts." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "VANTA — Give it a job. Keep the receipts.",
    description: "An observable work agent with real tools, receipts, and a payment boundary.",
    images: ["/brand/vanta-og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#EDE7DB",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={cn("font-sans antialiased", bricolage.variable, publicSans.variable, plexMono.variable)}
    >
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-primary focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:uppercase focus:text-primary-foreground"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
