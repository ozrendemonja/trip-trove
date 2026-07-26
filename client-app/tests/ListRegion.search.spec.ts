import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-continent-pages-list-region-listregion--primary"
  );

  await page.waitForSelector('div[data-automationid="DetailsList"]');
  await expect(
    page.getByRole("gridcell", { name: "Change region name from Samogitia" })
  ).toBeVisible();
});

test("Search dropdown displays all elements where the search value is a substring", async ({
  page
}) => {
  await page.getByRole("searchbox", { name: "Search" }).fill("Sam");
  await expect(page.getByRole("menuitem", { name: "Samogitia" })).toHaveCount(
    1
  );

  await expect(page).toHaveScreenshot();
});

test("Search dropdown shows region suggestions when a valid region is typed", async ({
  page
}) => {
  await page.getByRole("searchbox", { name: "Search" }).fill("Samogitia");
  await expect(
    page.getByRole("menuitem", { name: "Samogitia" })
  ).toBeVisible();

  await expect(page).toHaveScreenshot();
});
