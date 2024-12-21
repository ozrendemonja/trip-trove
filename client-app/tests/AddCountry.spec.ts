import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-continent-pages-add-country-addcountry--primary"
  );

  await page.getByRole("heading", { name: "Add Country" });
});

test("Save button is disabled when country name is empty and continent is not selected", async ({
  page
}) => {
  await page.waitForSelector(".ms-Button");

  await expect(page).toHaveScreenshot();
});

test("Save button is disabled when country name is empty and continent is selected", async ({
  page
}) => {
  await page.waitForSelector(".ms-Button");
  await page.getByRole("combobox", { name: "Select a continent" }).click();
  await page.getByRole("option", { name: "Australia" }).click();
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot();
});

test("Save button is disabled when country name is valid and continent is not selected", async ({
  page
}) => {
  await page.getByLabel("Country name").fill("Italy");
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot();
});

test("Save button is enabled when country name is valid and continent is selected", async ({
  page
}) => {
  await page.getByLabel("Country name").fill("Italy");
  await page.getByRole("combobox", { name: "Select a continent" }).click();
  await page.getByRole("option", { name: "Australia" }).click();
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot();
});

test("Save button is disabled and error message is shown when country name is too short", async ({
  page
}) => {
  await page.getByRole("combobox", { name: "Select a continent" }).click();
  await page.getByRole("option", { name: "Australia" }).click();
  await page.getByLabel("Country name").fill("Italy");
  await page.getByLabel("Country name").fill("");
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot();
});

test("Save button is disabled and error message is shown when country name is too long", async ({
  page
}) => {
  await page.getByRole("combobox", { name: "Select a continent" }).click();
  await page.getByRole("option", { name: "Australia" }).click();
  await page.getByLabel("Country name").fill("A".repeat(265));
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot();
});
