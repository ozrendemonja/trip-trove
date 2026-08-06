import { test, expect } from "@playwright/test";

test("Show spinner while trips are loading", async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-my-trip-mytriplist--with-trips"
  );

  await page.getByRole("main").waitFor();

  await expect(page).toHaveScreenshot();
});
