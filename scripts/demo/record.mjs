/**
 * VANTA demo recorder.
 *
 * Runs against the local product, exercises a free mission and a paid approval
 * (denied by default, so the recording costs nothing), and records a real
 * 16:9 browser video plus screenshots.
 *
 *   VANTA_BASE_URL=http://localhost:3000 npm run demo:record
 *   VANTA_DEMO_APPROVE=1 npm run demo:record   # approve one testnet call instead
 */
import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const base = (process.env.VANTA_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const outDir = path.resolve("artifacts/demo");
const videoDir = path.join(outDir, "raw");
const approve = process.env.VANTA_DEMO_APPROVE === "1";

function log(message) {
  console.log(`[vanta-demo] ${message}`);
}

async function reachable(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function alignTop(page, locator, offset = 40) {
  await locator.evaluate((el, y) => {
    const top = el.getBoundingClientRect().top + window.scrollY - y;
    window.scrollTo({ top, behavior: "instant" });
  }, offset);
  await page.waitForTimeout(450);
}

async function shot(page, name) {
  const target = path.join(outDir, name);
  await page.screenshot({ path: target, fullPage: false });
  log(`screenshot ${path.relative(process.cwd(), target)}`);
}

async function shotElement(page, selector, name) {
  const target = path.join(outDir, name);
  const locator = page.locator(selector).first();
  if ((await locator.count()) === 0) return;
  await locator.scrollIntoViewIfNeeded();
  await page.waitForTimeout(350);
  await locator.screenshot({ path: target });
  log(`element ${path.relative(process.cwd(), target)}`);
}

async function main() {
  if (!(await reachable(base))) {
    throw new Error(`No app at ${base}. Start it with \`npm run dev\` or set VANTA_BASE_URL.`);
  }

  await fs.mkdir(videoDir, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 2,
    reducedMotion: "reduce",
    recordVideo: { dir: videoDir, size: { width: 1600, height: 900 } },
  });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(String(err)));

  const video = page.video();

  try {
    log(`opening ${base}`);
    await page.goto(base, { waitUntil: "load", timeout: 60_000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(3200);
    await shot(page, "01-landing.png");
    await page.waitForTimeout(2200);

    await alignTop(page, page.locator("#story-heading"), 110);
    await page.waitForTimeout(1500);
    await shot(page, "02-how-it-works.png");
    await shotElement(page, '.receipt:has(#story-heading), section[aria-labelledby="story-heading"] .receipt', "02b-run-receipt.png");
    for (let scene = 1; scene < 5; scene++) {
      await page.locator(`[data-index="${scene}"]`).scrollIntoViewIfNeeded();
      await page.waitForTimeout(1500);
    }
    await page.waitForTimeout(1000);

    await page.goto(`${base}/workspace`, { waitUntil: "load", timeout: 60_000 });
    await page.waitForTimeout(1800);
    await shot(page, "03-workspace.png");
    await page.waitForTimeout(1200);

    // Free mission: real deterministic tools, no money involved.
    await page.getByLabel("Mission").fill("Calculate (18 * 4) / 3 and convert 12 km to miles.");
    await page.getByRole("button", { name: /run mission/i }).click();
    await page.getByRole("heading", { name: "Result" }).waitFor({ timeout: 150_000 });
    await page.waitForTimeout(1200);
    await alignTop(page, page.getByRole("heading", { name: "Result" }), 40);
    await page.waitForTimeout(2600);
    await shot(page, "04-free-run.png");
    await shotElement(page, 'section[aria-labelledby="result-heading"]', "04b-result-card.png");
    await shotElement(page, 'section[aria-labelledby="trace-heading"]', "04c-trace-card.png");
    for (const tool of ["calculate_expression", "convert_units"]) {
      const summary = page.locator("summary").filter({ hasText: tool }).first();
      if (await summary.count()) {
        await summary.click();
        await page.waitForTimeout(2200);
      }
    }
    await page.waitForTimeout(1000);

    // Paid mission: stop at the approval card.
    await page.getByLabel("Mission").fill("What is the weather in Mumbai?");
    await page.getByRole("button", { name: /run mission/i }).click();
    await page.getByRole("heading", { name: /payment approval required/i }).waitFor({ timeout: 150_000 });
    await page.waitForTimeout(800);
    await alignTop(page, page.getByRole("heading", { name: /payment approval required/i }), 40);
    await page.waitForTimeout(4200);
    await shot(page, "05-approval.png");
    await shotElement(page, 'section[aria-labelledby="approval-heading"]', "05b-approval-card.png");
    await page.waitForTimeout(2200);

    if (approve) {
      log("VANTA_DEMO_APPROVE=1 — approving one testnet payment");
      await page.getByRole("button", { name: /approve & pay/i }).click();
    } else {
      log("denying the paid call (no charge)");
      await page.getByRole("button", { name: /deny/i }).click();
    }
    await page.getByRole("heading", { name: "Result" }).waitFor({ timeout: 150_000 });
    await page.waitForTimeout(1200);
    await alignTop(page, page.getByRole("heading", { name: "Result" }), 40);
    await page.waitForTimeout(3400);
    await shot(page, approve ? "06-approved.png" : "06-denied.png");
    await shotElement(page, 'section[aria-labelledby="result-heading"]', "06b-result-card.png");
    await shotElement(page, 'section[aria-labelledby="sources-heading"]', "06c-sources-card.png");
    await page.waitForTimeout(1800);

    for (const [route, name] of [
      ["/tools", "07-tools.png"],
      ["/activity", "08-activity.png"],
      ["/settings", "09-settings.png"],
    ]) {
      await page.goto(`${base}${route}`, { waitUntil: "load", timeout: 60_000 });
      await page.waitForTimeout(2400);
      await shot(page, name);
      await page.waitForTimeout(900);
    }
    await page.waitForTimeout(1500);

    log(consoleErrors.length ? `browser console errors: ${consoleErrors.join(" | ")}` : "no browser console errors");
  } finally {
    await context.close();
    await browser.close();
  }

  if (!video) throw new Error("Playwright did not produce a video handle.");
  const rawPath = await video.path();
  const target = path.join(outDir, "vanta-walkthrough.webm");
  await fs.rm(target, { force: true });
  await fs.rename(rawPath, target);
  log(`video ${path.relative(process.cwd(), target)}`);
  log("done");
}

main().catch((err) => {
  console.error(`[vanta-demo] FAILED: ${err instanceof Error ? err.stack : String(err)}`);
  process.exit(1);
});
