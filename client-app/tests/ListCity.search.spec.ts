import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-continent-pages-list-city-listcity--primary"
  );

  await page.waitForSelector('div[data-automationid="DetailsList"]');
  await expect(
    page.getByRole("gridcell", { name: "Change city name for Kaunas" })
  ).toBeVisible();
});

test("Search ignores inputs shorter than 3 character", async ({ page }) => {
  await page.getByRole("searchbox", { name: "Search" }).fill("Vi");

  await expect(page).toHaveScreenshot();
});

test("Search dropdown displays all elements where the search value is a substring", async ({
  page
}) => {
  await page.getByRole("searchbox", { name: "Search" }).fill("Viln");
  await expect(
    page.getByRole("menuitem", { name: "Vilnius , Dzūkija, Lithuania" })
  ).toHaveCount(1);

  await expect(page).toHaveScreenshot();
});

test("Dropdown and search values are cleared when clicking on cancel search", async ({
  page
}) => {
  await page.getByRole("searchbox", { name: "Search" }).fill("Viln");
  await page.getByRole("button", { name: "Clear text" }).click();

  await expect(page).toHaveScreenshot();
});

test("Selected element is displayed in the table when chosen from the search dropdown, and the search value and dropdown are cleared", async ({
  page
}) => {
  await page.getByRole("searchbox", { name: "Search" }).fill("Viln");
  await page
    .getByRole("menuitem", { name: "Vilnius , Dzūkija, Lithuania" })
    .click();
  await expect(
    page.getByRole("menuitem", { name: "Vilnius , Dzūkija, Lithuania" })
  ).toHaveCount(0);

  await expect(page).toHaveScreenshot();
});
