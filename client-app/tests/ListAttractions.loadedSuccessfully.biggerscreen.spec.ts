import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 2560, height: 1920 });

  await page.goto(
    "http://localhost:6006/iframe.html?id=features-continent-pages-list-attraction-listattraction--primary"
  );

  await page.getByRole("grid", { name: "Item details" }).waitFor();
  await expect(
    page.getByRole("gridcell", { name: /Vilnius Old Town$/ }).nth(0)
  ).toBeVisible();
});

test("Show all attraction columns on a wide screen", async ({ page }) => {
  await expect(page).toHaveScreenshot();
});
