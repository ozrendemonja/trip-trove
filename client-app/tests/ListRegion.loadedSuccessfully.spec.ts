import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-continent-pages-list-region-listregion--primary"
  );

  await page.getByRole("grid", { name: "Item details" }).waitFor();
  await expect(
    page.getByRole("gridcell", { name: "Change region name from Samogitia" })
  ).toBeVisible();
});

test("Show list of regions with disabled delete button when no element is selected ", async ({
  page
}) => {
  await expect(page).toHaveScreenshot();
});

test("Edit country dropdown shows suggestions when a valid country is typed", async ({
  page
}) => {
  const row = page.getByRole("row").filter({
    has: page.getByRole("button", {
      name: "Change region name from Samogitia"
    })
  });
  await row
    .getByRole("button", {
      name: "Change country name from Lithuania"
    })
    .click();
  await page.getByLabel("Select a country").fill("Mon");
  await expect(page.getByRole("menuitem", { name: "Monaco" })).toBeVisible();

  await expect(page).toHaveScreenshot();
});
