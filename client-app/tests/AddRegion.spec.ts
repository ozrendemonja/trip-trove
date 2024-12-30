import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-continent-pages-add-region-addregion--primary"
  );

  await page.getByRole("heading", { name: "Add Region" });
});

test("Save button is disabled when region name is empty and country is not selected", async ({
  page
}) => {
  await page.waitForSelector(".ms-Button");

  await expect(page).toHaveScreenshot();
});

test("Save button is disabled when region name is empty and country is selected", async ({
  page
}) => {
  await page.getByLabel("Select a country").fill("Lith");
  await page.getByRole("menuitem", { name: "Lithuania" }).click();
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page.getByLabel("Select a country")).toHaveValue("Lithuania");
  await expect(page).toHaveScreenshot();
});

test("Save button is disabled when region name is valid and country is not selected", async ({
  page
}) => {
  await page.getByLabel("Region name").fill("Dzūkija");
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot();
});

test("Save button is disabled when region name is valid and country name is changed after selection", async ({
  page
}) => {
  await page.getByLabel("Region name").fill("Dzūkija");
  await page.getByLabel("Select a country").fill("Lith");
  await page.getByRole("menuitem", { name: "Lithuania" }).click();
  await page.getByLabel("Select a country").fill("Invalid");
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page.getByLabel("Select a country")).toHaveValue("Invalid");
  await expect(page).toHaveScreenshot();
});

test("List of suggested countries are shown after user type first 3 characters", async ({
  page
}) => {
  await page.getByLabel("Select a country").fill("Lith");

  await expect(page.getByLabel("Select a country")).toHaveValue("Lith");
  await expect(page).toHaveScreenshot();
});

test("Save button is enabled when region name is valid and country is selected", async ({
  page
}) => {
  await page.getByLabel("Region name").fill("Dzūkija");
  await page.getByLabel("Select a country").fill("Lith");
  await page.getByRole("menuitem", { name: "Lithuania" }).click();

  await expect(page.getByLabel("Select a country")).toHaveValue("Lithuania");
  await expect(page).toHaveScreenshot();
});

test("Save button is disabled and error message is shown when region name is too short", async ({
  page
}) => {
  await page.getByLabel("Select a country").fill("Lith");
  await page.getByRole("menuitem", { name: "Lithuania" }).click();
  await page.getByLabel("Region name").fill("Dzūkija");
  await page.getByLabel("Region name").fill("");
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot();
});

test("Save button is disabled and error message is shown when region name is too long", async ({
  page
}) => {
  await page.getByLabel("Select a country").fill("Lith");
  await page.getByRole("menuitem", { name: "Lithuania" }).click();
  await page.getByLabel("Region name").fill("Dzūkija");
  await page.getByLabel("Region name").fill("a".repeat(265));
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot();
});
