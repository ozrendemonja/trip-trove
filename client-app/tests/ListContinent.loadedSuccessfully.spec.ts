import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-continent-pages-list-continent-listcontinent--primary"
  );

  await page.waitForSelector('div[data-automationid="DetailsList"]');
});

test("Show list of continents with disabled delete button when no element is selected ", async ({
  page
}) => {
  await expect(page).toHaveScreenshot();
});
