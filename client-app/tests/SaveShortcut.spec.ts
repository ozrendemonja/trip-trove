import { test, expect } from "@playwright/test";

const LIST_CONTINENT_STORY =
  "http://localhost:6006/iframe.html?id=features-continent-pages-list-continent-listcontinent--primary";

// Fluent dialogs portal outside the story canvas, so scope queries to the
// dialog to avoid clashing with the list behind it.
const MODAL = '[role="dialog"]';

test.beforeEach(async ({ page }) => {
  await page.goto(LIST_CONTINENT_STORY);
  // Wait for the list to finish loading (spinner -> rows) before interacting.
  await expect(
    page.getByRole("button", {
      name: "Change value for Australia",
      exact: true
    })
  ).toBeVisible({ timeout: 15000 });
});

test("Saves the edited name when Ctrl+S is pressed in the edit dialog", async ({
  page
}) => {
  await page
    .getByRole("button", { name: "Change value for Australia", exact: true })
    .click();

  const modal = page.locator(MODAL);
  await expect(
    modal.getByRole("heading", { name: "Modifying Australia" })
  ).toBeVisible();

  await modal.getByRole("textbox").fill("Australia ctrl s test");
  await expect(modal.getByRole("button", { name: "Update" })).toBeEnabled();

  await page.keyboard.press("Control+s");

  await expect(
    page.getByRole("button", {
      name: "Change value for Australia ctrl s test",
      exact: true
    })
  ).toBeVisible({ timeout: 15000 });
  await expect(
    page.getByRole("button", {
      name: "Change value for Australia",
      exact: true
    })
  ).toBeHidden();
});

test("Does not submit the edit dialog when Ctrl+S is pressed with an invalid name", async ({
  page
}) => {
  await page
    .getByRole("button", { name: "Change value for Europe", exact: true })
    .click();
  const modal = page.locator(MODAL);
  await expect(
    modal.getByRole("heading", { name: "Modifying Europe" })
  ).toBeVisible();

  await modal.getByRole("textbox").fill("");
  await modal.getByRole("textbox").blur();
  await expect(modal.getByRole("button", { name: "Update" })).toBeDisabled();

  await page.keyboard.press("Control+s");

  await expect(
    modal.getByRole("heading", { name: "Modifying Europe" })
  ).toBeVisible();
  await expect(modal.getByRole("button", { name: "Update" })).toBeDisabled();
});
