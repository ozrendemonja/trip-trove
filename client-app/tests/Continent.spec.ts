import { test, expect } from '@playwright/test';

test('Show list of continents', async ({ page }) => {
  await page.goto('http://localhost:6006/iframe.html?id=features-continent-pages-continent--primary');

  await page.waitForSelector('div[data-automationid="DetailsList"]');
  await expect(page).toHaveScreenshot();
});

test('Select all continents in the list when check all icon is clicked', async ({ page }) => {
  await page.goto('http://localhost:6006/iframe.html?id=features-continent-pages-continent--primary');

  await page.waitForSelector('div[data-automationid="DetailsList"]');
  await page.getByLabel('Select all rows').getByRole("checkbox").click();

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
