import { test, expect } from '@playwright/test';

test('Show list of continents', async ({ page }) => {
  await page.goto('http://localhost:6006/iframe.html?id=features-continent-pages-continent--primary');

  await page.waitForSelector('div[data-automationid="DetailsList"]');
  await expect(page).toHaveScreenshot();
});

test('Select continent when clicked on the check icon', async ({ page }) => {
  await page.goto('http://localhost:6006/iframe.html?id=features-continent-pages-continent--primary');

  await page.waitForSelector('div[data-automationid="DetailsList"]');
  await page.click('div[data-list-index="1"]');

  await expect(page).toHaveScreenshot();
});

test('Select continent when click on the row', async ({ page }) => {
  await page.goto('http://localhost:6006/iframe.html?id=features-continent-pages-continent--primary');

  await page.waitForSelector('div[data-automationid="DetailsList"]');
  await page.getByRole("gridcell", { name: "Asia" }).click();

  await expect(page).toHaveScreenshot();
});

test('Present continents in ascending order when click on the sort icon', async ({ page }) => {
  await page.goto('http://localhost:6006/iframe.html?id=features-continent-pages-continent--primary');

  await page.waitForSelector('div[data-automationid="DetailsList"]');
  await page.getByRole("columnheader", { name: "name" }).click();

  await expect(page).toHaveScreenshot();
});

test('Present continents in descending order when click twice on the sort icon', async ({ page }) => {
  await page.goto('http://localhost:6006/iframe.html?id=features-continent-pages-continent--primary');

  await page.waitForSelector('div[data-automationid="DetailsList"]');
  await page.getByRole("columnheader", { name: "name" }).click();
  await page.getByRole("columnheader", { name: "name" }).click();

  await expect(page).toHaveScreenshot();
});


test('Delete button is disabled when no element is selected', async ({ page }) => {
  await page.goto('http://localhost:6006/iframe.html?id=features-continent-pages-continent--primary');

  await page.waitForSelector('div[data-automationid="DetailsList"]');

  await expect(page).toHaveScreenshot();
});

test('All delete menu buttons are enabled when open it', async ({ page }) => {
  await page.goto('http://localhost:6006/iframe.html?id=features-continent-pages-continent--primary');

  await page.waitForSelector('div[data-automationid="DetailsList"]');
  await page.getByRole("gridcell", { name: "Australia" }).click();
  await page.getByRole("menuitem", { name: "Delete continent" }).click();

  await expect(page).toHaveScreenshot();
});

test('All elements should be present when canceling delete menu', async ({ page }) => {
  await page.goto('http://localhost:6006/iframe.html?id=features-continent-pages-continent--primary');

  await page.waitForSelector('div[data-automationid="DetailsList"]');
  await page.getByRole("gridcell", { name: "Australia" }).click();
  await page.getByRole("menuitem", { name: "Delete continent" }).click();
  await page.getByRole("button", { name: "Cancel" }).click();

  await expect(page).toHaveScreenshot();
});

test('All buttons on delete menu are disabled when delete request is sent', async ({ page }) => {
  await page.goto('http://localhost:6006/iframe.html?id=features-continent-pages-continent--primary');

  await page.waitForSelector('div[data-automationid="DetailsList"]');
  await page.getByRole("gridcell", { name: "Australia" }).click();
  await page.getByRole("menuitem", { name: "Delete continent" }).click();
  await page.getByRole("button", { name: "Delete" }).click();

  await expect(page).toHaveScreenshot();
});

test('List should not contain previously deleted element when delete menu closes', async ({ page }) => {
  await page.goto('http://localhost:6006/iframe.html?id=features-continent-pages-continent--primary');

  await page.waitForSelector('div[data-automationid="DetailsList"]');
  await page.getByRole("gridcell", { name: "Australia" }).click();
  await page.getByRole("menuitem", { name: "Delete continent" }).click();
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(0);

  await expect(page).toHaveScreenshot();
});