import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-continent-pages-list-country-listcountry--primary"
  );

  await page.getByRole("grid", { name: "Item details" }).waitFor();
  await expect(
    page.getByRole("gridcell", { name: "Change country name for San Marino" })
  ).toBeVisible();
});

test("Search dropdown displays all elements where the search value is a substring", async ({
  page
}) => {
  await page.getByRole("searchbox", { name: "Search" }).fill("Lit");
  await expect(page.getByRole("menuitem", { name: "Lithuania" })).toHaveCount(
    1
  );

  await expect(page).toHaveScreenshot();
});
