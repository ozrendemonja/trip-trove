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

test("All delete menu buttons are enabled when open it", async ({ page }) => {
  await page.getByRole("gridcell", { name: "San Marino" }).click();
  await page.getByRole("menuitem", { name: "Delete country" }).click();

  await expect(page).toHaveScreenshot();
});

test("All elements should be present when canceling delete menu", async ({
  page
}) => {
  await page.getByRole("gridcell", { name: "San Marino" }).click();
  await page.getByRole("menuitem", { name: "Delete country" }).click();
  await page.getByRole("button", { name: "Cancel" }).click();

  await expect(page).toHaveScreenshot();
});

test("All buttons on delete menu are disabled when delete request is sent", async ({
  page
}) => {
  await page.getByRole("gridcell", { name: "San Marino" }).click();
  await page.getByRole("menuitem", { name: "Delete country" }).click();
  await page.getByRole("button", { name: "Delete" }).click();

  await expect(page).toHaveScreenshot();
});

test("List should not contain previously deleted element when delete menu closes", async ({
  page
}) => {
  await page.getByRole("gridcell", { name: "San Marino" }).click();
  await page.getByRole("menuitem", { name: "Delete country" }).click();
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(0);
  await expect(page.getByRole("gridcell", { name: "San Marino" })).toHaveCount(
    0
  );
  await expect(
    page
      .locator('div[data-selection-index="1"]')
      .getByRole("gridcell", { name: "Monaco" })
  ).toHaveCount(1);

  await expect(page).toHaveScreenshot();
});
