import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-ai-table-components-board--plan-mode"
  );

  await expect(page.getByText("Eiffel Tower")).toBeVisible();
});

test("Show board in Plan mode without manual checkboxes", async ({ page }) => {
  await expect(page.getByRole("button", { name: /Plan/i })).toHaveAttribute(
    "aria-current",
    "step"
  );
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await expect(page).toHaveScreenshot();
});
