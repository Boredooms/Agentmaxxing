import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..", "..");
const outDir = path.join(root, "artifacts", "social", "x");
const htmlUrl = pathToFileURL(path.join(root, "scripts", "social", "x-posts.html")).href;

const posts = [
  { id: "p01", file: "01-wallet.png" },
  { id: "p02", file: "02-approval.png" },
  { id: "p03", file: "03-x402.png" },
  { id: "p04", file: "04-settlement.png" },
  { id: "p05", file: "05-delta.png" },
  { id: "p06", file: "06-trace.png" },
  { id: "p07", file: "07-testnet.png" },
  { id: "p08", file: "08-tools.png" },
  { id: "p09", file: "09-demo.png" },
  { id: "p10", file: "10-close.png" },
];

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1680, height: 980 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();

await page.goto(htmlUrl, { waitUntil: "networkidle" });
await page.evaluate(async () => {
  await Promise.all([
    document.fonts.load('800 92px "Bricolage Grotesque"'),
    document.fonts.load('500 12px "IBM Plex Mono"'),
    document.fonts.load('400 19px "Public Sans"'),
  ]);
  await document.fonts.ready;
});
await page.waitForTimeout(450);

for (const post of posts) {
  await page.locator(`#${post.id}`).screenshot({
    path: path.join(outDir, post.file),
    type: "png",
  });
  console.log(`${post.file} 1600x900`);
}

await context.close();
await browser.close();
console.log(`Wrote ${posts.length} X frames to ${path.relative(root, outDir)}.`);
