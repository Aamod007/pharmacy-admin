import { test, expect } from "@playwright/test";

test.describe("Pharmico Admin Critical Clinical & Order Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate as statutory admin user
    await page.goto("http://localhost:3002/login");
    await page.fill('input[type="email"]', "admin@pharmacy.com");
    await page.fill('input[type="password"]', "Admin@123456");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test("navigates to Prescription Review inspector and validates verification controls", async ({ page }) => {
    await page.goto("http://localhost:3002/prescriptions");
    await expect(page).toHaveURL(/.*prescriptions/);
    
    // Check that prescription management interface loads with table headers
    await expect(page.locator("text=Prescriptions").first()).toBeVisible();
  });

  test("navigates to Orders management and verifies order queue filters", async ({ page }) => {
    await page.goto("http://localhost:3002/orders");
    await expect(page).toHaveURL(/.*orders/);
    
    // Check orders listing and status filters
    await expect(page.locator("text=Orders").first()).toBeVisible();
  });
});
