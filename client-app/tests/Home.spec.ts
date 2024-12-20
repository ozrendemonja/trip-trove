import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-home--primary"
  );

  await page.waitForSelector(".ms-Button");
});

test("Expend dashboard list when click on the text", async ({ page }) => {
  await page.getByRole("button", { name: "Dashboard" }).click();

  await expect(page).toHaveScreenshot();
});
