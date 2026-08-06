import { test, expect } from "@playwright/test";

test("Show spinner while city is loading", async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-continent-pages-list-attraction-listattraction--primary"
  );

  await page.getByRole("main").waitFor();

  await expect(page).toHaveScreenshot();
});
