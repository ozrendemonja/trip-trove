import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-continent-pages-list-country-listcountry--primary"
  );

  await page.waitForSelector('div[data-automationid="DetailsList"]');
  await expect(page.getByRole("gridcell", { name: "San Marino" })).toHaveCount(
    1
  );
});

test("Show list of countries with disabled delete button when no element is selected ", async ({
  page
}) => {
  await expect(page).toHaveScreenshot();
});

test("Select country when clicked on the check icon", async ({ page }) => {
  await page.click('div[data-list-index="2"]');

  await expect(page).toHaveScreenshot();
});

test("Select country when click on the row", async ({ page }) => {
  await page.getByRole("gridcell", { name: "San Marino" }).click();

  await expect(page).toHaveScreenshot();
});

test("List should be ordered ascending when sorted by oldest", async ({
  page
}) => {
  await page.getByRole("combobox").click();
  await page.getByRole("option", { name: "Oldest" }).click();
  await expect(
    page
      .locator('div[data-selection-index="0"]')
      .getByRole("gridcell", { name: "Monaco" })
  ).toHaveCount(1);

  await expect(page).toHaveScreenshot();
});
