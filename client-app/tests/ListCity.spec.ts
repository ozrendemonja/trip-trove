import { test, expect } from "@playwright/test";

test("Show spinner while city is loading", async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-continent-pages-list-city-listcity--primary"
  );

  await page.waitForSelector(".ms-Spinner-label");

  await expect(page).toHaveScreenshot();
});
