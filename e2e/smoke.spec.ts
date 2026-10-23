import { expect, test } from "@playwright/test";

test.describe("VANTA product surface", () => {
  test("all routes render without horizontal overflow", async ({ page }) => {
    for (const path of ["/", "/workspace", "/tools", "/activity", "/settings", "/brand"]) {
      await page.goto(path, { waitUntil: "networkidle" });
      await expect(page.locator("body")).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      expect(overflow, `horizontal overflow on ${path}`).toBe(false);
    }
  });

  test("mobile layout has no horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const path of ["/", "/workspace", "/tools", "/activity", "/settings", "/brand"]) {
      await page.goto(path, { waitUntil: "networkidle" });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      expect(overflow, `horizontal overflow on mobile ${path}`).toBe(false);
    }
  });

  test("brand page serves the downloadable X assets", async ({ page, request }) => {
    await page.goto("/brand", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: /the field manual, in files/i, level: 1 })).toBeVisible();

    for (const path of ["/brand/vanta-x-pfp.png", "/brand/vanta-x-banner.png", "/brand/vanta-og.png", "/brand/vanta-brand-kit.zip"]) {
      const response = await request.get(path);
      expect(response.ok(), `${path} should be downloadable`).toBe(true);
    }
  });

  test("crypto proof is visible and the demo video is served", async ({ page, request }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: /receipt is on-chain/i })).toBeVisible();
    await expect(page.getByText("0x9b376282…52f9").first()).toBeVisible();

    const video = await request.head("/demo/vanta-crypto-demo.mp4");
    expect(video.ok(), "the downloadable crypto demo should be served").toBe(true);
    expect(video.headers()["content-type"]).toContain("video/mp4");
  });

  test("free mission runs real tools and shows a trace", async ({ page }) => {
    await page.goto("/workspace", { waitUntil: "networkidle" });
    const mission = page.getByLabel("Mission");
    await mission.fill("Calculate (18 * 4) / 3.");
    await page.getByRole("button", { name: /run mission/i }).click();
    await expect(page.getByRole("heading", { name: "Result" })).toBeVisible({ timeout: 120_000 });
    await expect(page.getByText("calculate_expression").first()).toBeVisible();
    await expect(page.getByText("24").first()).toBeVisible();
    await expect(page.getByText("Execution trace")).toBeVisible();
  });

  test("paid mission asks for approval and denial never executes it", async ({ page }) => {
    await page.goto("/workspace", { waitUntil: "networkidle" });
    await page.getByLabel("Mission").fill("What is the weather in Mumbai?");
    await page.getByRole("button", { name: /run mission/i }).click();
    await expect(page.getByRole("heading", { name: /payment approval required/i })).toBeVisible({ timeout: 120_000 });
    await expect(page.getByText("Base Sepolia").first()).toBeVisible();
    await page.getByRole("button", { name: /deny/i }).click();
    await expect(page.getByRole("heading", { name: "Result" })).toBeVisible({ timeout: 120_000 });
    // The visible trace must mark the paid step as denied, regardless of how
    // the model phrases its prose. A denial can never produce a receipt.
    const paidStep = page.locator("summary").filter({ hasText: "get_weather" }).first();
    await expect(paidStep).toContainText(/denied/i);
    await expect(page.locator(".answer-text")).toBeVisible();
    await expect(page.getByText(/settled/i)).toHaveCount(0);
  });
});
