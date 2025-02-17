import { test, expect } from "@playwright/test";

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

test("Save button is disabled when only country is provided", async ({
  page
}) => {
  await page.getByLabel("Select a country").fill("Lith");
  await page.getByRole("menuitem", { name: "Lithuania" }).click();
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot({ fullPage: true });
});

test("Error is shown when country is selected and then diselected", async ({
  page
}) => {
  await page.getByLabel("Select a country").fill("Lith");
  await page.getByRole("menuitem", { name: "Lithuania" }).click();
  await page.getByLabel("Select a country").fill("Wrong");

  await expect(page).toHaveScreenshot({ fullPage: true });
});

test("Save button is disabled when only country and city are provided", async ({
  page
}) => {
  await page.getByLabel("Select a country").fill("Mon");
  await page.getByRole("menuitem", { name: "Monaco" }).click();
  await page.getByLabel("Select a city").fill("Mon");
  await page.getByRole("menuitem", { name: "Monaco, Monaco, Monaco" }).click();
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot({ fullPage: true });
});

test("Error is shown when city is selected and then diselected", async ({
  page
}) => {
  await page.getByLabel("Select a country").fill("Mon");
  await page.getByRole("menuitem", { name: "Monaco" }).click();
  await page.getByLabel("Select a city").fill("Mon");
  await page.getByRole("menuitem", { name: "Monaco, Monaco, Monaco" }).click();
  await page.getByLabel("Select a city").fill("Wrong");

  await expect(page).toHaveScreenshot({ fullPage: true });
});

test("Save button is disabled when only country and region are provided", async ({
  page
}) => {
  await page.getByLabel("Select a country").fill("Mon");
  await page.getByRole("menuitem", { name: "Monaco" }).click();
  await page.getByLabel("Attraction is region level").check();
  await page.getByLabel("Select a region").fill("Mon");
  await page.getByRole("menuitem", { name: "Monaco" }).click();
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot({ fullPage: true });
});

test("Error is shown when region is selected and then diselected", async ({
  page
}) => {
  await page.getByLabel("Select a country").fill("Mon");
  await page.getByRole("menuitem", { name: "Monaco" }).click();
  await page.getByLabel("Attraction is region level").check();
  await page.getByLabel("Select a region").fill("Mon");
  await page.getByRole("menuitem", { name: "Monaco" }).click();
  await page.getByLabel("Select a region").fill("Wrong");

  await expect(page).toHaveScreenshot({ fullPage: true });
});

test("Save button is disabled when only country, region and attraction name are provided", async ({
  page
}) => {
  await page.getByLabel("Select a country").fill("Mon");
  await page.getByRole("menuitem", { name: "Monaco" }).click();
  await page.getByLabel("Attraction is region level").check();
  await page.getByLabel("Select a region").fill("Mon");
  await page.getByRole("menuitem", { name: "Monaco" }).click();
  await page.getByLabel("Attraction name").fill("Casino Square");
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot({ fullPage: true });
});

test("Error is shown when attraction name is not provided", async ({
  page
}) => {
  await page.getByLabel("Attraction name").fill("Casino Square");
  await page.getByLabel("Attraction name").fill("");
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot({ fullPage: true });
});

test("Error is shown when attraction name is too long", async ({ page }) => {
  await page.getByLabel("Attraction name").fill("abcd".repeat(512) + "a");
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot({ fullPage: true });
});

test("Save button is disabled when country, region, attraction name and main attraction are provided", async ({
  page
}) => {
  await page.getByLabel("Select a country").fill("Mon");
  await page.getByRole("menuitem", { name: "Monaco" }).click();
  await page.getByLabel("Attraction is region level").check();
  await page.getByLabel("Select a region").fill("Mon");
  await page.getByRole("menuitem", { name: "Monaco" }).click();
  await page.getByLabel("Attraction name").fill("Casino Square");
  await page.getByLabel("Part of attraction").check();
  await page.getByLabel("Select main attraction name").fill("Cas");
  await page.getByRole("menuitem", { name: "Casino Square" }).click();
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot({ fullPage: true });
});

test("Save button is disabled when only country, region, attraction name, attraction address are provided", async ({
  page
}) => {
  await page.getByLabel("Select a country").fill("Mon");
  await page.getByRole("menuitem", { name: "Monaco" }).click();
  await page.getByLabel("Attraction is region level").check();
  await page.getByLabel("Select a region").fill("Mon");
  await page.getByRole("menuitem", { name: "Monaco" }).click();
  await page.getByLabel("Attraction name").fill("Casino Square");
  await page
    .getByLabel("Attraction address")
    .fill("Pl. du Casino, 98000 Monaco");
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot({ fullPage: true });
});

test("Error is shown when attraction address is too long", async ({ page }) => {
  await page.getByLabel("Attraction address").fill("abcd".repeat(128) + "a");
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot({ fullPage: true });
});

test("Save button is disabled when only country, region, attraction name, geo location are provided", async ({
  page
}) => {
  await page.getByLabel("Select a country").fill("Mon");
  await page.getByRole("menuitem", { name: "Monaco" }).click();
  await page.getByLabel("Attraction is region level").check();
  await page.getByLabel("Select a region").fill("Mon");
  await page.getByRole("menuitem", { name: "Monaco" }).click();
  await page.getByLabel("Attraction name").fill("Casino Square");
  await page.getByLabel("Geo location").fill("43.7397097,-7.4247538");
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot({ fullPage: true });
});

test("Error is shown when geo location is not number", async ({ page }) => {
  await page.getByLabel("Geo location").fill("43.7397097a,-7.4247538");
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot({ fullPage: true });
});

test("Error is shown when geo location latitude is invalid", async ({
  page
}) => {
  await page.getByLabel("Geo location").fill("90.000001,-7.4247538");
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot({ fullPage: true });
});

test("Error is shown when geo location longitude is invalid", async ({
  page
}) => {
  await page.getByLabel("Geo location").fill("43.7397097a,-180.00001");
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot({ fullPage: true });
});

test("Save button is disabled when only country, region, attraction name, category and type are provided", async ({
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
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot({ fullPage: true });
});

test("Save button is disabled when only country, region, attraction name, category and type and tip are provided", async ({
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
  await page.getByLabel("Tip").fill("Test tip");
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot({ fullPage: true });
});

test("Error is shown when tip is too long", async ({ page }) => {
  await page.getByLabel("Tip").fill("Test".repeat(512) + "a");
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot({ fullPage: true });
});

test("Save button is disabled when only country, region, attraction name, category and type and info from are provided", async ({
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
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot({ fullPage: true });
});

test("Error message is shown when info from is empty", async ({ page }) => {
  await page.getByLabel("Where information comes from").fill("Test info");
  await page.getByLabel("Where information comes from").fill("");
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot({ fullPage: true });
});

test("Error message is shown when info from is too long", async ({ page }) => {
  await page
    .getByLabel("Where information comes from")
    .fill("Test".repeat(128) + "a");
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
