import { chromium } from "playwright";
import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..", "..");
const brandDir = path.join(root, "public", "brand");
const demoDir = path.join(root, "public", "demo");
const htmlUrl = pathToFileURL(path.join(root, "scripts", "brand", "kit.html")).href;

const artboards = [
  { id: "pfp", file: "vanta-x-pfp.png", width: 400, height: 400 },
  { id: "banner", file: "vanta-x-banner.png", width: 1500, height: 500 },
  { id: "og", file: "vanta-og.png", width: 1200, height: 630 },
];

await mkdir(brandDir, { recursive: true });
await mkdir(demoDir, { recursive: true });

const browser = await chromium.launch();

async function render(scale) {
  const context = await browser.newContext({
    viewport: { width: 1740, height: 1000 },
    deviceScaleFactor: scale,
  });
  const page = await context.newPage();
  await page.goto(htmlUrl, { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    await Promise.all([
      document.fonts.load('800 80px "Bricolage Grotesque"'),
      document.fonts.load('500 12px "IBM Plex Mono"'),
      document.fonts.load('400 16px "Public Sans"'),
    ]);
    await document.fonts.ready;
  });
  await page.waitForTimeout(350);

  for (const art of artboards) {
    const name = scale === 1 ? art.file : art.file.replace(/\.png$/, "@2x.png");
    await page.locator(`#${art.id}`).screenshot({ path: path.join(brandDir, name), type: "png" });
    console.log(`${name} ${art.width * scale}x${art.height * scale}`);
  }

  if (scale === 1) {
    await page.locator("#apple").screenshot({ path: path.join(root, "app", "apple-icon.png"), type: "png" });
    console.log("app/apple-icon.png 180x180");
  }

  await context.close();
}

await render(1);
await render(2);
await browser.close();

await copyFile(path.join(root, "public", "vanta-logo.svg"), path.join(brandDir, "vanta-logo.svg"));
await copyFile(path.join(root, "app", "icon.svg"), path.join(brandDir, "vanta-mark.svg"));

for (const shot of ["01-landing.png", "04c-trace-card.png", "05b-approval-card.png", "06c-sources-card.png"]) {
  await copyFile(path.join(root, "artifacts", "demo", shot), path.join(demoDir, shot));
}

console.log("Brand artboards, logo files and product proof images are in place.");
