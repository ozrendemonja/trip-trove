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

test("Show list of countries with disabled delete button when no element is selected ", async ({
  page
}) => {
  await expect(page).toHaveScreenshot();
});

