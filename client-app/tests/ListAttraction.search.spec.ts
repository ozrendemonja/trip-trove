import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-continent-pages-list-attraction-listattraction--primary"
  );

  await page.waitForSelector('div[data-automationid="DetailsList"]');
  await expect(
    page.getByRole("gridcell", { name: "Vilnius Old Town" })
  ).toBeVisible();
});

test("Search ignores inputs shorter than 3 character", async ({ page }) => {
  await page.getByRole("searchbox", { name: "Search" }).fill("Ca");

  await expect(page).toHaveScreenshot();
});

test("Search dropdown displays all elements where the search value is a substring", async ({
  page
}) => {
  await page.getByRole("searchbox", { name: "Search" }).fill("Cas");
  await expect(
    page.getByRole("menuitem", { name: "Casino of Monte-Carlo" })
  ).toHaveCount(1);
  await expect(
    page.getByRole("menuitem", { name: "Casino Square" })
  ).toHaveCount(1);

  await expect(page).toHaveScreenshot();
});

test("Dropdown and search values are cleared when clicking on cancel search", async ({
  page
}) => {
  await page.getByRole("searchbox", { name: "Search" }).fill("Cas");
  await page.getByRole("button", { name: "Clear text" }).click();

  await expect(page).toHaveScreenshot();
});

test("Selected element is displayed in the table when chosen from the search dropdown, and the search value and dropdown are cleared", async ({
  page
}) => {
  await page.getByRole("searchbox", { name: "Search" }).fill("Cas");
  await page.getByRole("menuitem", { name: "Casino Square" }).click();
  await expect(
    page.getByRole("menuitem", { name: "Casino Square" })
  ).toHaveCount(0);

  await expect(page).toHaveScreenshot();
});
