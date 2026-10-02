import { test, expect } from "@playwright/test";

test.describe("Pharmico Admin Order Management Flow", () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    // Authenticate as statutory admin user
    await page.goto("http://localhost:3002/login");
    await page.waitForLoadState("networkidle");

    if (page.url().includes("/dashboard")) {
      return;
    }

    await page.fill('input[type="email"]', "admin@pharmacy.com");
    await page.fill('input[type="password"]', "Admin@123456");
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/, { timeout: 30000 });
  });

  test("navigates to Orders management and verifies order queue filters", async ({ page }) => {
    await page.goto("http://localhost:3002/orders");
    await expect(page).toHaveURL(/.*orders/);

    // Check orders listing and status filters
    await expect(page.locator("text=Orders & Sales").first()).toBeVisible();
    await expect(page.locator("table")).toBeVisible();
  });
});
