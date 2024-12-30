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

test("Show list of regions with disabled delete button when no element is selected ", async ({
  page
}) => {
  await expect(page).toHaveScreenshot();
});

test("Select region when clicked on the check icon", async ({ page }) => {
  await page
    .locator('div[data-list-index="2"]')
    .getByRole("radio", { name: "select row" })
    .click();

  await expect(page).toHaveScreenshot();
});

test("Select region when click on the row", async ({ page }) => {
  await page
    .getByRole("gridcell", { name: "Change region name from Monaco" })
    .click();

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
      .getByRole("gridcell", { name: "Change region name from Monaco" })
  ).toHaveCount(1);

  await expect(page).toHaveScreenshot();
});

test("All delete menu buttons are enabled when open it", async ({ page }) => {
  await page
    .getByRole("gridcell", { name: "Change region name from Monaco" })
    .click();
  await page.getByRole("menuitem", { name: "Delete region" }).click();

  await expect(page).toHaveScreenshot();
});

test("All elements should be present when canceling delete menu", async ({
  page
}) => {
  await page
    .getByRole("gridcell", { name: "Change region name from Monaco" })
    .click();
  await page.getByRole("menuitem", { name: "Delete region" }).click();
  await page.getByRole("button", { name: "Cancel" }).click();
  await page
    .getByRole("gridcell", { name: "Change region name from Monaco" })
    .focus();

  await expect(page).toHaveScreenshot();
});

test("All buttons on delete menu are disabled when delete request is sent", async ({
  page
}) => {
  await page
    .getByRole("gridcell", { name: "Change region name from Monaco" })
    .click();
  await page.getByRole("menuitem", { name: "Delete region" }).click();
  await page.getByRole("button", { name: "Delete" }).click();

  await expect(page).toHaveScreenshot();
});

test("List should not contain previously deleted element when delete menu closes", async ({
  page
}) => {
  await page
    .getByRole("gridcell", { name: "Change region name from Monaco" })
    .click();
  await page.getByRole("menuitem", { name: "Delete region" }).click();
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(0);
  await expect(
    page.getByRole("gridcell", { name: "Change region name from Monaco" })
  ).toHaveCount(0);
  await expect(
    page
      .locator('div[data-selection-index="2"]')
      .getByRole("gridcell", { name: "Change region name from Samogitia" })
  ).toHaveCount(1);

  await expect(page).toHaveScreenshot();
});

test("Display the edit region name dialog prepopulated with existing data when the edit button in the name column is clicked", async ({
  page
}) => {
  await page
    .getByRole("button", { name: "Change region name from Monaco" })
    .click();

  await expect(page).toHaveScreenshot();
});

test("Update button on the the edit region name dialog is disabled and error message is shown when added name is empty", async ({
  page
}) => {
  await page
    .getByRole("button", { name: "Change region name from Monaco" })
    .click();
  await page.getByLabel("Region name", { exact: true }).fill("Aukštaitija");
  await page.getByLabel("Region name", { exact: true }).fill("");
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot();
});

test("Update button on the the edit region is disabled and error message is shown when added name is invalid", async ({
  page
}) => {
  await page
    .getByRole("button", { name: "Change region name from Monaco" })
    .click();
  await page.getByLabel("Region name", { exact: true }).fill("a".repeat(257));
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot();
});

test("List is shown unchanged when update menu is closed without action", async ({
  page
}) => {
  await page
    .getByRole("button", { name: "Change region name from Monaco" })
    .click();
  await page.getByLabel("Region name", { exact: true }).fill("Test");
  await page.getByRole("button", { name: "Cancel" }).click();

  await expect(page).toHaveScreenshot();
});

test("All buttons on the the edit region name dialog are disabled when the update is taking place", async ({
  page
}) => {
  await page
    .getByRole("button", { name: "Change region name from Monaco" })
    .click();
  await page
    .getByLabel("Region name", { exact: true })
    .fill("Monaco update test");
  await page.getByRole("button", { name: "Update" }).click();

  await expect(page).toHaveScreenshot();
});

test("List should contain updated values when edit region name dialog closes", async ({
  page
}) => {
  await page
    .getByRole("button", { name: "Change region name from Monaco" })
    .click();
  await page
    .getByLabel("Region name", { exact: true })
    .fill("Monaco update test");
  await page.getByRole("button", { name: "Update" }).click();
  await expect(
    page.getByRole("gridcell", {
      name: "Change region name from Monaco update test"
    })
  ).toHaveCount(1);

  await expect(page).toHaveScreenshot();
});

test("Display the edit country name dialog prepopulated with existing data when the edit button in the continent column is clicked", async ({
  page
}) => {
  page
    .locator('div[data-selection-index="1"]')
    .getByRole("button", {
      name: "Change country name from Lithuania"
    })
    .click();

  await expect(page).toHaveScreenshot();
});

test("List is shown unchanged when edit country name is closed without action", async ({
  page
}) => {
  page
    .locator('div[data-selection-index="1"]')
    .getByRole("button", {
      name: "Change country name from Lithuania"
    })
    .click();
  await page.getByLabel("Select a country").fill("Dzūkija");
  await page.getByRole("button", { name: "Cancel" }).click();

  await expect(page).toHaveScreenshot();
});

test("All buttons on the the edit country name dialog are disabled when the update is taking place", async ({
  page
}) => {
  page
    .locator('div[data-selection-index="1"]')
    .getByRole("button", {
      name: "Change country name from Lithuania"
    })
    .click();
  await page.getByLabel("Select a country").fill("Mon");
  await page.getByRole("menuitem", { name: "Monaco" }).click();
  await page.getByRole("button", { name: "Update" }).click();

  await expect(page).toHaveScreenshot();
});

test("Update button in the edit region name dialog is disabled and error message is shown when user chose a name and then change the value", async ({
  page
}) => {
  page
    .locator('div[data-selection-index="1"]')
    .getByRole("button", {
      name: "Change country name from Lithuania"
    })
    .click();
  await page.getByLabel("Select a country").fill("Mon");
  await page.getByRole("menuitem", { name: "Monaco" }).click();
  await page.getByLabel("Select a country").fill("Monac");

  await expect(page).toHaveScreenshot();
});

test("List should contain updated values when edit country name dialog closes", async ({
  page
}) => {
  page
    .locator('div[data-selection-index="1"]')
    .getByRole("button", {
      name: "Change country name from Lithuania"
    })
    .click();
  await page.getByLabel("Select a country").fill("Mon");
  await page.getByRole("menuitem", { name: "Monaco" }).click();
  await page.getByRole("button", { name: "Update" }).click();
  await expect(
    page.getByRole("gridcell", {
      name: "Monaco"
    })
  ).toHaveCount(3);

  await expect(page).toHaveScreenshot();
});
