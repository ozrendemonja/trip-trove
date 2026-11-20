import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-ai-table-components-board--edit-mode"
  );

  await expect(page.getByText("Eiffel Tower")).toBeVisible();
});

test("Show board in edit mode with attractions loaded", async ({ page }) => {
  await expect(
    page.getByRole("heading", { name: "Paris", exact: true })
  ).toBeVisible();
  await expect(page.getByText("Eiffel Tower")).toBeVisible();
  await expect(page.getByText("Louvre Museum")).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Show Edit mode button as active by default", async ({ page }) => {
  await expect(page.getByRole("button", { name: /Edit/i })).toHaveAttribute(
    "aria-current",
    "step"
  );
  await expect(page).toHaveScreenshot();
});

test("Board has no JSON import or export controls", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Save JSON" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Load JSON" })).toHaveCount(0);
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  await expect(page).toHaveScreenshot();
});

test("Switch to Plan mode when Plan button is clicked", async ({ page }) => {
  await page.getByRole("button", { name: /Plan/i }).click();

  await expect(page.getByRole("button", { name: /Plan/i })).toHaveAttribute(
    "aria-current",
    "step"
  );
  await expect(page).toHaveScreenshot();
});

test("Switch back to Edit mode from Plan mode", async ({ page }) => {
  await page.getByRole("button", { name: /Plan/i }).click();
  await page.getByRole("button", { name: /Edit/i }).click();

  await expect(page.getByRole("button", { name: /Edit/i })).toHaveAttribute(
    "aria-current",
    "step"
  );
  await expect(page).toHaveScreenshot();
});

test("Trip header owns the steps and Board renders no mode buttons", async ({
  page
}) => {
  await expect(
    page.getByRole("navigation", { name: "Trip steps" }).getByRole("button")
  ).toHaveCount(5);
  await expect(
    page
      .locator(".attraction-board-wrapper")
      .getByRole("button", { name: /^(Prepare|Edit|Itinerary|Plan|Review)$/ })
  ).toHaveCount(0);
  await expect(page).toHaveScreenshot();
});

test("Show filter dropdowns on demand", async ({ page }) => {
  await expect(page.getByRole("combobox")).toHaveCount(0);
  await page.getByRole("button", { name: "Filters on demand" }).click();
  await expect(
    page.getByRole("combobox", { name: "Countrywide" })
  ).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "Must Visit" })
  ).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Switch to Plan mode using Alt+4 keyboard shortcut", async ({ page }) => {
  await page.keyboard.press("Alt+4");

  await expect(page.getByRole("button", { name: /Plan/i })).toHaveAttribute(
    "aria-current",
    "step"
  );
});

test("Switch back to Edit mode using Alt+2 keyboard shortcut", async ({
  page
}) => {
  await page.keyboard.press("Alt+4");
  await page.keyboard.press("Alt+2");

  await expect(page.getByRole("button", { name: /Edit/i })).toHaveAttribute(
    "aria-current",
    "step"
  );
});

test("Cycle from Edit to Itinerary and Plan using Ctrl+V", async ({ page }) => {
  await page.keyboard.press("Control+v");
  await expect(page.getByRole("button", { name: "Itinerary" })).toHaveAttribute(
    "aria-current",
    "step"
  );
  await page.keyboard.press("Control+v");

  await expect(page.getByRole("button", { name: /Plan/i })).toHaveAttribute(
    "aria-current",
    "step"
  );
});

test("Cycle from Plan through Review and Prepare back to Edit", async ({
  page
}) => {
  await page.keyboard.press("Alt+4");
  await page.keyboard.press("Control+v");
  await expect(page.getByRole("button", { name: "Review" })).toHaveAttribute(
    "aria-current",
    "step"
  );
  await page.keyboard.press("Control+v");
  await expect(page.getByRole("button", { name: "Prepare" })).toHaveAttribute(
    "aria-current",
    "step"
  );
  await page.keyboard.press("Control+v");

  await expect(page.getByRole("button", { name: /Edit/i })).toHaveAttribute(
    "aria-current",
    "step"
  );
});

test("Alt+5 cannot bypass Edit from Prepare", async ({ page }) => {
  await page.keyboard.press("Alt+1");
  await page.keyboard.press("Alt+5");

  await expect(page.getByRole("button", { name: "Prepare" })).toHaveAttribute(
    "aria-current",
    "step"
  );
  await expect(page.getByRole("button", { name: "Review" })).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Review" })
  ).toHaveAccessibleDescription("After Edit");
});
