import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-ai-table-components-board--plan-mode"
  );

  await expect(page.getByText("Eiffel Tower")).toBeVisible();
});

test("Show board in Plan mode with itinerary checkboxes", async ({ page }) => {
  await expect(page.getByRole("button", { name: /Plan/i })).toHaveClass(
    /mode-btn-active/
  );
  await expect(page).toHaveScreenshot();
});

test("Show board in Plan mode with pre-selected itinerary items", async ({
  page
}) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-ai-table-components-board--plan-mode-with-selections"
  );

  await expect(page.getByText("Eiffel Tower")).toBeVisible();
  await expect(page.getByRole("button", { name: /Plan/i })).toHaveClass(
    /mode-btn-active/
  );
  await expect(page).toHaveScreenshot();
});
