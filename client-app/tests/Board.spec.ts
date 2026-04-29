import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-ai-table-components-board--edit-mode"
  );

  await expect(page.getByText("Eiffel Tower")).toBeVisible();
});

test("Show board in edit mode with attractions loaded", async ({ page }) => {
  await expect(page.getByText("Paris")).toBeVisible();
  await expect(page.getByText("Eiffel Tower")).toBeVisible();
  await expect(page.getByText("Louvre Museum")).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Show Edit mode button as active by default", async ({ page }) => {
  await expect(page.getByRole("button", { name: /Edit/i })).toHaveClass(
    /mode-btn-active/
  );
  await expect(page).toHaveScreenshot();
});

test("Show Save JSON and Load JSON buttons in toolbar", async ({ page }) => {
  await expect(
    page.getByRole("button", { name: "Save JSON" })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Load JSON" })
  ).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Switch to Plan mode when Plan button is clicked", async ({ page }) => {
  await page.getByRole("button", { name: /Plan/i }).click();

  await expect(page.getByRole("button", { name: /Plan/i })).toHaveClass(
    /mode-btn-active/
  );
  await expect(page).toHaveScreenshot();
});

test("Switch back to Edit mode from Plan mode", async ({ page }) => {
  await page.getByRole("button", { name: /Plan/i }).click();
  await page.getByRole("button", { name: /Edit/i }).click();

  await expect(page.getByRole("button", { name: /Edit/i })).toHaveClass(
    /mode-btn-active/
  );
  await expect(page).toHaveScreenshot();
});

test("Review button is not visible when no tripId is provided", async ({
  page
}) => {
  await expect(page.getByRole("button", { name: /Review/i })).toHaveCount(0);
  await expect(page).toHaveScreenshot();
});

test("Show filter dropdowns in toolbar", async ({ page }) => {
  await expect(page.getByText("Countrywide")).toBeVisible();
  await expect(page.getByText("Must-visit")).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Switch to Plan mode using Alt+2 keyboard shortcut", async ({ page }) => {
  await page.keyboard.press("Alt+2");

  await expect(page.getByRole("button", { name: /Plan/i })).toHaveClass(
    /mode-btn-active/
  );
});

test("Switch back to Edit mode using Alt+1 keyboard shortcut", async ({
  page
}) => {
  await page.keyboard.press("Alt+2");
  await page.keyboard.press("Alt+1");

  await expect(page.getByRole("button", { name: /Edit/i })).toHaveClass(
    /mode-btn-active/
  );
});

test("Cycle from Edit to Plan using Ctrl+V keyboard shortcut", async ({
  page
}) => {
  await page.keyboard.press("Control+v");

  await expect(page.getByRole("button", { name: /Plan/i })).toHaveClass(
    /mode-btn-active/
  );
});

test("Cycle back to Edit from Plan using Ctrl+V when no tripId", async ({
  page
}) => {
  await page.keyboard.press("Control+v");
  await page.keyboard.press("Control+v");

  await expect(page.getByRole("button", { name: /Edit/i })).toHaveClass(
    /mode-btn-active/
  );
});

test("Alt+3 does not switch to Review mode when no tripId", async ({
  page
}) => {
  await page.keyboard.press("Alt+3");

  await expect(page.getByRole("button", { name: /Edit/i })).toHaveClass(
    /mode-btn-active/
  );
  await expect(page.getByRole("button", { name: /Review/i })).toHaveCount(0);
});
