import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-continent-pages-list-attraction-user-listattractionuser--primary"
  );

  await page.waitForSelector('div[data-automationid="DetailsList"]');
  await expect(
    page.getByRole("gridcell", { name: "Vilnius Old Town" })
  ).toBeVisible();
});

test("Show list of user attractions", async ({ page }) => {
  await expect(page).toHaveScreenshot();
});

test("Show list of filtered elements with unselected element when first time opened", async ({
  page
}) => {
  await page.getByRole("button", { name: "Filters" }).click();
  await expect(
    page.getByRole("heading", { name: "Search filters" })
  ).toBeVisible();

  await expect(page).toHaveScreenshot();
});

test("Show selected filter elements when open filter settings after select elements", async ({
  page
}) => {
  await page.getByRole("button", { name: "Filters" }).click();
  await expect(
    page.getByRole("heading", { name: "Search filters" })
  ).toBeVisible();
  page.getByRole("button", { name: "Countrywide" }).click();
  await expect(
    page.getByRole("gridcell", { name: "Vilnius Old Town" })
  ).toHaveCount(1);

  await page.getByRole("button", { name: "Filters" }).click();
  await expect(
    page.getByRole("heading", { name: "Search filters" })
  ).toBeVisible();

  await expect(page).toHaveScreenshot();
});

test("Show selected filter elements when changed filter settings", async ({
  page
}) => {
  // Selet 1st element
  await page.getByRole("button", { name: "Filters" }).click();
  await expect(
    page.getByRole("heading", { name: "Search filters" })
  ).toBeVisible();
  page.getByRole("button", { name: "Countrywide" }).click();

  // Selet 2nd element
  await page.getByRole("button", { name: "Filters" }).click();
  await expect(
    page.getByRole("heading", { name: "Search filters" })
  ).toBeVisible();
  page.getByRole("button", { name: "Local" }).click();
  await expect(
    page.getByRole("gridcell", { name: "Vilnius Old Town" })
  ).toHaveCount(1);

  await page.getByRole("button", { name: "Filters" }).click();
  await expect(
    page.getByRole("heading", { name: "Search filters" })
  ).toBeVisible();

  await expect(page).toHaveScreenshot();
});

test("Show not have selected filter elements when disable selected filter settings", async ({
  page
}) => {
  await page.getByRole("button", { name: "Filters" }).click();
  await expect(
    page.getByRole("heading", { name: "Search filters" })
  ).toBeVisible();
  page.getByRole("button", { name: "Countrywide" }).click();

  // Diselect
  await page.getByRole("button", { name: "Filters" }).click();
  await expect(
    page.getByRole("heading", { name: "Search filters" })
  ).toBeVisible();
  page.getByRole("button", { name: "Countrywide" }).click();

  await expect(
    page.getByRole("gridcell", { name: "Vilnius Old Town" })
  ).toHaveCount(1);

  await page.getByRole("button", { name: "Filters" }).click();
  await expect(
    page.getByRole("heading", { name: "Search filters" })
  ).toBeVisible();

  await expect(page).toHaveScreenshot();
});

test("Show all selected filter elements when multiple elements are selected", async ({
  page
}) => {
  //1st element
  await page.getByRole("button", { name: "Filters" }).click();
  await expect(
    page.getByRole("heading", { name: "Search filters" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Countrywide" }).click();

  //2nd element
  await page.getByRole("button", { name: "Filters" }).click();
  await expect(
    page.getByRole("heading", { name: "Search filters" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Skip-Worthy Spots" }).click();

  //3rd element
  await page.getByRole("button", { name: "Filters" }).click();
  await expect(
    page.getByRole("heading", { name: "Search filters" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Traditional" }).click();

  //4th element
  await page.getByRole("button", { name: "Filters" }).click();
  await expect(
    page.getByRole("heading", { name: "Search filters" })
  ).toBeVisible();
  await page.getByRole("button", { name: "SPECIALITY_MUSEUM" }).click();

  //5th element
  await page.getByRole("button", { name: "Filters" }).click();
  await expect(
    page.getByRole("heading", { name: "Search filters" })
  ).toBeVisible();
  page.getByRole("button", { name: "STABLE" }).click();
  await expect(
    page.getByRole("gridcell", { name: "Vilnius Old Town" })
  ).toHaveCount(1);

  await page.getByRole("button", { name: "Filters" }).click();
  await expect(
    page.getByRole("heading", { name: "Search filters" })
  ).toBeVisible();

  await expect(page).toHaveScreenshot();
});

test("Show all selected filter elements when multiple elements are selected and then one is changed", async ({
  page
}) => {
  //1st element
  await page.getByRole("button", { name: "Filters" }).click();
  await expect(
    page.getByRole("heading", { name: "Search filters" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Countrywide" }).click();

  //2nd element
  await page.getByRole("button", { name: "Filters" }).click();
  await expect(
    page.getByRole("heading", { name: "Search filters" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Skip-Worthy Spots" }).click();

  //3rd element
  await page.getByRole("button", { name: "Filters" }).click();
  await expect(
    page.getByRole("heading", { name: "Search filters" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Traditional" }).click();

  //4th element
  await page.getByRole("button", { name: "Filters" }).click();
  await expect(
    page.getByRole("heading", { name: "Search filters" })
  ).toBeVisible();
  await page.getByRole("button", { name: "SPECIALITY_MUSEUM" }).click();

  //5th element
  await page.getByRole("button", { name: "Filters" }).click();
  await expect(
    page.getByRole("heading", { name: "Search filters" })
  ).toBeVisible();
  page.getByRole("button", { name: "STABLE" }).click();

  // change 4th
  await page.getByRole("button", { name: "Filters" }).click();
  await expect(
    page.getByRole("heading", { name: "Search filters" })
  ).toBeVisible();
  await page.getByRole("button", { name: "AIR_BASED_ACTIVITY" }).click();

  await expect(
    page.getByRole("gridcell", { name: "Vilnius Old Town" })
  ).toHaveCount(1);

  await page.getByRole("button", { name: "Filters" }).click();
  await expect(
    page.getByRole("heading", { name: "Search filters" })
  ).toBeVisible();

  await expect(page).toHaveScreenshot();
});

test("Show all selected filter elements when multiple elements are selected and then one is diselected", async ({
  page
}) => {
  //1st element
  await page.getByRole("button", { name: "Filters" }).click();
  await expect(
    page.getByRole("heading", { name: "Search filters" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Countrywide" }).click();

  //2nd element
  await page.getByRole("button", { name: "Filters" }).click();
  await expect(
    page.getByRole("heading", { name: "Search filters" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Skip-Worthy Spots" }).click();

  //3rd element
  await page.getByRole("button", { name: "Filters" }).click();
  await expect(
    page.getByRole("heading", { name: "Search filters" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Traditional" }).click();

  //4th element
  await page.getByRole("button", { name: "Filters" }).click();
  await expect(
    page.getByRole("heading", { name: "Search filters" })
  ).toBeVisible();
  await page.getByRole("button", { name: "SPECIALITY_MUSEUM" }).click();

  //5th element
  await page.getByRole("button", { name: "Filters" }).click();
  await expect(
    page.getByRole("heading", { name: "Search filters" })
  ).toBeVisible();
  page.getByRole("button", { name: "STABLE" }).click();

  // diselect 5th
  await page.getByRole("button", { name: "Filters" }).click();
  await expect(
    page.getByRole("heading", { name: "Search filters" })
  ).toBeVisible();
  await page.getByRole("button", { name: "STABLE" }).click();

  await expect(
    page.getByRole("gridcell", { name: "Vilnius Old Town" })
  ).toHaveCount(1);

  await page.getByRole("button", { name: "Filters" }).click();
  await expect(
    page.getByRole("heading", { name: "Search filters" })
  ).toBeVisible();

  await expect(page).toHaveScreenshot();
});
