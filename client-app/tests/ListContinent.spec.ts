import { test, expect } from "@playwright/test";

test("Show spinner while content is loading", async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-continent-pages-list-continent-listcontinent--primary"
  );

  await page.getByRole("main").waitFor();

  await expect(page).toHaveScreenshot();
});
