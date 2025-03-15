import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-continent-pages-add-city-addcity--primary"
  );

  await page.getByRole("heading", { name: "Add City" });
});

test("Save button is disabled when city name is empty and region is not selected", async ({
  page
}) => {
  await page.waitForSelector(".ms-Button");

  await expect(page).toHaveScreenshot();
});

test("Save button is disabled when city name is empty and region is selected", async ({
  page
}) => {
  await page.getByLabel("Select a region").fill("Sam");
  await page.getByRole("menuitem", { name: "Samogitia" }).click();
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page.getByLabel("Select a region")).toHaveValue("Samogitia");
  await expect(page).toHaveScreenshot();
});

test("Save button is disabled when city name is valid and region is not selected", async ({
  page
}) => {
  await page.getByLabel("City name").fill("Telšiai");
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot();
});

test("Save button is disabled when city name is valid and region name is changed after selection", async ({
  page
}) => {
  await page.getByLabel("City name").fill("Telšiai");
  await page.getByLabel("Select a region").fill("Sam");
  await page.getByRole("menuitem", { name: "Samogitia" }).click();
  await page.getByLabel("Select a region").fill("Invalid");
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page.getByLabel("Select a region")).toHaveValue("Invalid");
  await expect(page).toHaveScreenshot();
});

test("List of suggested regions are shown after user type first 3 characters", async ({
  page
}) => {
  await page.getByLabel("Select a region").fill("Samo");

  await expect(page.getByLabel("Select a region")).toHaveValue("Samo");

  await expect(page.getByRole("menuitem", { name: "Samogitia" })).toHaveCount(
    1
  );
  await expect(page).toHaveScreenshot();
});

test("Save button is enabled when city name is valid and region is selected", async ({
  page
}) => {
  await page.getByLabel("City name").fill("Telšiai");
  await page.getByLabel("Select a region").fill("Sam");
  await page.getByRole("menuitem", { name: "Samogitia" }).click();

  await expect(page.getByRole("menuitem", { name: "Samogitia" })).toHaveCount(
    0
  );
  await expect(page).toHaveScreenshot();
});

test("Save button is disabled and error message is shown when city name is too short", async ({
  page
}) => {
  await page.getByLabel("Select a region").fill("Sam");
  await page.getByRole("menuitem", { name: "Samogitia" }).click();
  await page.getByLabel("City name").fill("Telšiai");
  await page.getByLabel("City name").fill("");
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot();
});

test("Save button is disabled and error message is shown when city name is too long", async ({
  page
}) => {
  await page.getByLabel("Select a region").fill("Sam");
  await page.getByRole("menuitem", { name: "Samogitia" }).click();
  await page.getByLabel("City name").fill("Telšiai");
  await page.getByLabel("City name").fill("a".repeat(265));
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot();
});
