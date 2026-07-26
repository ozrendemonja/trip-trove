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

test("Search dropdown displays all elements where the search value is a substring", async ({
  page
}) => {
  await page.getByRole("searchbox", { name: "Search" }).fill("Viln");
  await expect(
    page.getByRole("menuitem", { name: "Vilnius , Dzūkija, Lithuania" })
  ).toHaveCount(1);

  await expect(page).toHaveScreenshot();
});
