import { test, expect } from "@playwright/test";

test("Show empty board when no attractions are provided", async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-ai-table-components-board--empty"
  );

  await expect(page.getByRole("button", { name: /Edit/i })).toBeVisible();
  await expect(page.getByText("Eiffel Tower")).toHaveCount(0);
  await expect(page).toHaveScreenshot();
});

test("Show single city board", async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-ai-table-components-board--single-city"
  );

  await expect(page.getByText("Paris")).toBeVisible();
  await expect(page.getByText("Eiffel Tower")).toBeVisible();
  await expect(page).toHaveScreenshot();
});
