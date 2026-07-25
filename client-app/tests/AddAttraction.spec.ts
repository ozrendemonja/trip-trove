import { test, expect } from "@playwright/test";

// Interaction and validation behaviour is covered functionally by the
// AddAttraction Storybook play functions (see AddAttraction.stories.tsx, run
// via `npm run test-attraction-stories`). These Playwright tests keep a small
// set of full-page visual regression baselines for the key form states.

test.beforeEach(async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-continent-pages-add-attraction-addattraction--primary"
  );

  await page.getByRole("heading", { name: "Add Attraction" });
});

test("Save button is disabled when no data is provided", async ({ page }) => {
  await page.waitForSelector(".ms-Button");

  await expect(page).toHaveScreenshot({ fullPage: true });
});

test("Error is shown when attraction name is too long", async ({ page }) => {
  await page.getByLabel("Attraction name").fill("abcd".repeat(512) + "a");
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot({ fullPage: true });
});

test("Save button is enabled when only country, region, attraction name, category and type, info from and info recorded are provided", async ({
  page
}) => {
  await page.getByLabel("Select a country").fill("Mon");
  await page.getByRole("menuitem", { name: "Monaco" }).click();
  await page.getByLabel("Attraction is region level").check();
  await page.getByLabel("Select a region").fill("Mon");
  await page.getByRole("menuitem", { name: "Monaco" }).click();
  await page.getByLabel("Attraction name").fill("Casino Square");
  await page.getByRole("combobox", { name: "Attraction category" }).click();
  await page
    .getByRole("option", { name: "POINT_OF_INTEREST_AND_LANDMARK" })
    .click();
  await page.getByRole("combobox", { name: "Attraction type" }).click();
  await page.getByRole("option", { name: "STABLE" }).click();
  await page.getByLabel("Where information comes from").fill("Test info");
  await page
    .getByRole("combobox", { name: "Select recorded date..." })
    .fill("Mon Feb 17 2025");
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot({ fullPage: true });
});

test("Suggestions are shown when searching a country", async ({ page }) => {
  await page.getByLabel("Select a country").fill("Mon");
  await expect(page.getByRole("menuitem", { name: "Monaco" })).toBeVisible();

  await expect(page).toHaveScreenshot({ fullPage: true });
});

test("Suggestions are shown when searching a city", async ({ page }) => {
  await page.getByLabel("Select a country").fill("Mon");
  await page.getByRole("menuitem", { name: "Monaco" }).click();
  await page.getByLabel("Select a city").fill("Mon");
  await expect(
    page.getByRole("menuitem", { name: "Monaco, Monaco, Monaco" })
  ).toBeVisible();

  await expect(page).toHaveScreenshot({ fullPage: true });
});

test("Suggestions are shown when searching where information comes from", async ({
  page
}) => {
  await page.getByLabel("Where information comes from").fill("Lon");
  await expect(
    page.getByRole("menuitem", { name: "Lonely Planet" })
  ).toBeVisible();

  await expect(page).toHaveScreenshot({ fullPage: true });
});
