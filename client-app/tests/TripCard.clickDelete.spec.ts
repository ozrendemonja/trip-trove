import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-my-trip-tripcard--click-delete"
  );

  await expect(page.getByText("Italy")).toBeVisible();
});

test("Show delete button on trip card", async ({ page }) => {
  await expect(page.getByLabel("Delete trip")).toBeVisible();
  await expect(page).toHaveScreenshot();
});
