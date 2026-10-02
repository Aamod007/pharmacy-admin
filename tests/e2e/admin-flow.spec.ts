import { test, expect } from "@playwright/test";

test.describe("Pharmico Admin E2E Smoke Flow", () => {
  test("authenticates, displays KPI metrics, and navigates catalog wizard", async ({ page }) => {
    await page.goto("http://localhost:3002/login");
    await page.waitForLoadState("domcontentloaded");
    await page.fill('input[type="email"]', "admin@pharmacy.com");
    await page.fill('input[type="password"]', "Admin@123456");
    await Promise.all([
      page.waitForURL(/.*dashboard/, { timeout: 20000 }),
      page.click('button[type="submit"]'),
    ]);

    // Dashboard navigation check
    await expect(page.locator("text=Store Overview & Analytics")).toBeVisible();

    // Navigate to Add Product wizard
    await page.click('button:has-text("Add Product +")');
    await expect(page).toHaveURL(/.*products\/add/);
    await expect(page.locator("text=Product Media")).toBeVisible();
  });
});
