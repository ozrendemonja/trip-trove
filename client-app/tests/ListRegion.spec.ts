import { test, expect } from "@playwright/test";

test("Show spinner while region is loading", async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-continent-pages-list-region-listregion--primary"
  );

  await page.waitForSelector(".ms-Spinner-label");

  await expect(page).toHaveScreenshot();
});
