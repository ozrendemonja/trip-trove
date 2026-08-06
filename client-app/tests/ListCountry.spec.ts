import { test, expect } from "@playwright/test";

test("Show spinner while country is loading", async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-continent-pages-list-country-listcountry--primary"
  );

  await page.getByRole("main").waitFor();

  await expect(page).toHaveScreenshot();
});
