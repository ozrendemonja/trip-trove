import { test, expect } from "@playwright/test";

const COLOR_GOLD = "#f4b400"; // Not visited any must-visit
const COLOR_YELLOW = "#FCE600"; // Some must-visit visited
const COLOR_GRAY = "#9aa0a6"; // All must-visit visited

test.beforeEach(async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-countries-map-countriesvisitedmap--primary"
  );

  await expect(
    page.getByRole("heading", { name: "Countries visited map" })
  ).toBeVisible();

  await expect(page.locator(`path[fill="${COLOR_GOLD}"]`).first()).toBeVisible();
});

test("Loads focused on Europe with the correct must-visit colours", async ({
  page
}) => {
  await expect(page.locator(`path[fill="${COLOR_GOLD}"]`)).not.toHaveCount(0);
  await expect(page.locator(`path[fill="${COLOR_YELLOW}"]`)).not.toHaveCount(0);
  await expect(page.locator(`path[fill="${COLOR_GRAY}"]`)).not.toHaveCount(0);

  await expect(page).toHaveScreenshot();
});
