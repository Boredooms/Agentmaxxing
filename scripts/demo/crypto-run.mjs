import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const base = process.env.VANTA_BASE_URL || "http://localhost:3210";
const root = path.resolve(import.meta.dirname, "..", "..");
const outDir = path.join(root, "artifacts", "demo", "crypto");
const rawDir = path.join(root, "artifacts", "demo", "raw", "crypto");
const mission = process.env.VANTA_CRYPTO_MISSION || "What is the weather in Mumbai?";
const shouldApprove = process.env.VANTA_CRYPTO_APPROVE !== "0";

await mkdir(outDir, { recursive: true });
await mkdir(rawDir, { recursive: true });

async function wallet() {
  const response = await fetch(`${base}/api/wallet`);
  if (!response.ok) throw new Error(`Wallet API returned ${response.status}`);
  return response.json();
}

async function receipt(txHash) {
  const response = await fetch("https://sepolia.base.org", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_getTransactionReceipt",
      params: [txHash],
    }),
  });
  if (!response.ok) throw new Error(`Base RPC returned ${response.status}`);
  const json = await response.json();
  return json.result;
}

const before = await wallet();
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1600, height: 900 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();

const consoleErrors = [];
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});

try {
  await page.goto(`${base}/workspace`, { waitUntil: "networkidle" });
  await page.getByLabel("Mission").waitFor({ state: "visible" });
  await page.screenshot({ path: path.join(rawDir, "workspace.png") });

  const walletSection = page.locator('section[aria-labelledby="wallet-heading"]');
  await walletSection.screenshot({ path: path.join(outDir, "wallet-before.png") });

  await page.getByLabel("Mission").fill(mission);
  await page.getByRole("button", { name: /run mission/i }).click();

  const approval = page.locator('section[aria-labelledby="approval-heading"]');
  await approval.waitFor({ state: "visible", timeout: 120_000 });
  const approvalText = await approval.innerText();
  await page.screenshot({ path: path.join(rawDir, "approval-page.png") });
  await approval.screenshot({ path: path.join(outDir, "approval.png") });

  if (!shouldApprove) {
    await page.getByRole("button", { name: /deny/i }).click();
    await page.getByRole("heading", { name: "Result" }).waitFor({ state: "visible", timeout: 120_000 });
    await page.screenshot({ path: path.join(rawDir, "denied-page.png") });
    throw new Error("VANTA_CRYPTO_APPROVE=0 requested the denial path; no settlement was made.");
  }

  const responsePromise = page.waitForResponse(
    (response) => response.url().endsWith("/api/agent") && response.request().method() === "POST",
    { timeout: 150_000 }
  );
  await page.getByRole("button", { name: /approve & pay/i }).click();
  const response = await responsePromise;
  const run = await response.json();
  if (!response.ok()) throw new Error(`Approval failed: ${run.error ?? response.status()}`);

  await page.getByRole("heading", { name: "Result" }).waitFor({ state: "visible", timeout: 120_000 });
  await page.screenshot({ path: path.join(rawDir, "result-page.png") });

  const resultSection = page.locator('section[aria-labelledby="result-heading"]');
  await resultSection.screenshot({ path: path.join(outDir, "result.png") });

  const walletAfterSection = page.locator('section[aria-labelledby="wallet-heading"]');
  await walletAfterSection.screenshot({ path: path.join(outDir, "wallet-after.png") });

  const paidStep = page.locator("details").filter({ hasText: "get_weather" }).first();
  await paidStep.locator("summary").click();
  const receiptLink = paidStep.locator('a[href*="/tx/"]').first();
  await receiptLink.waitFor({ state: "visible", timeout: 30_000 });
  const explorer = await receiptLink.getAttribute("href");
  const txHash = explorer?.split("/tx/")[1]?.split("?")[0] ?? null;
  if (!txHash) throw new Error("The paid step did not expose a transaction hash.");
  await paidStep.screenshot({ path: path.join(outDir, "receipt.png") });

  const traceSection = page.locator('section[aria-labelledby="trace-heading"]');
  await traceSection.screenshot({ path: path.join(outDir, "trace.png") });

  const after = await wallet();
  const chain = await receipt(txHash);
  if (!chain) throw new Error(`No Base Sepolia receipt found for ${txHash}`);
  if (chain.status !== "0x1") throw new Error(`Transaction ${txHash} did not succeed (status ${chain.status}).`);

  const paidStepData = run.steps.find((step) => step.tool === "get_weather");
  const payment = paidStepData?.result?.payment ?? null;

  const record = {
    capturedAt: new Date().toISOString(),
    mission,
    approval: {
      decision: "approved",
      cardText: approvalText,
    },
    runId: run.runId,
    network: run.network ?? "Base Sepolia",
    tool: "get_weather",
    amountUsdc: payment?.amount ?? "0.01 USDC",
    txHash,
    explorer,
    chain: {
      status: chain.status,
      blockNumber: chain.blockNumber,
      from: chain.from,
      to: chain.to,
      gasUsed: chain.gasUsed,
    },
    wallet: {
      address: before.address,
      before: { eth: before.balance, usdc: before.usdc },
      after: { eth: after.balance, usdc: after.usdc },
    },
    steps: run.steps?.map((step) => ({
      tool: step.tool,
      paid: step.paid,
      cost: step.cost,
      durationMs: step.durationMs,
      denied: step.denied ?? false,
      hasReceipt: Boolean(step.result?.payment?.txHash),
    })),
    consoleErrors,
  };

  await writeFile(path.join(outDir, "run.json"), JSON.stringify(record, null, 2));
  console.log(JSON.stringify(record, null, 2));
} finally {
  await context.close();
  await browser.close();
}
