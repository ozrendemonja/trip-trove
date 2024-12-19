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

test("Select continent when clicked on the check icon", async ({ page }) => {
  await page.click('div[data-list-index="1"]');

  await expect(page).toHaveScreenshot();
});

test("Select continent when click on the row", async ({ page }) => {
  await page.getByRole("gridcell", { name: "Asia" }).click();

  await expect(page).toHaveScreenshot();
});

test("Present continents in ascending order when click on the sort icon", async ({
  page
}) => {
  await page.getByRole("columnheader", { name: "name" }).click();

  await expect(page).toHaveScreenshot();
});

test("Present continents in descending order when click twice on the sort icon", async ({
  page
}) => {
  await page.getByRole("columnheader", { name: "name" }).click();
  await page.getByRole("columnheader", { name: "name" }).click();

  await expect(page).toHaveScreenshot();
});

test("All delete menu buttons are enabled when open it", async ({ page }) => {
  await page.getByRole("gridcell", { name: "Australia" }).click();
  await page.getByRole("menuitem", { name: "Delete continent" }).click();

  await expect(page).toHaveScreenshot();
});

test("All elements should be present when canceling delete menu", async ({
  page
}) => {
  await page.getByRole("gridcell", { name: "Australia" }).click();
  await page.getByRole("menuitem", { name: "Delete continent" }).click();
  await page.getByRole("button", { name: "Cancel" }).click();

  await expect(page).toHaveScreenshot();
});

test("All buttons on delete menu are disabled when delete request is sent", async ({
  page
}) => {
  await page.getByRole("gridcell", { name: "Australia" }).click();
  await page.getByRole("menuitem", { name: "Delete continent" }).click();
  await page.getByRole("button", { name: "Delete" }).click();

  await expect(page).toHaveScreenshot();
});

test("List should not contain previously deleted element when delete menu closes", async ({
  page
}) => {
  await page.getByRole("gridcell", { name: "Australia" }).click();
  await page.getByRole("menuitem", { name: "Delete continent" }).click();
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(0);

  await expect(page).toHaveScreenshot();
});

test("Display the edit dialog prepopulated with existing data when the edit button in the name column is clicked", async ({
  page
}) => {
  await page
    .getByRole("button", { name: "Change value for Australia" })
    .click();

  await expect(page).toHaveScreenshot();
});

test("Update button is disabled and error message is shown when added name is empty", async ({
  page
}) => {
  await page
    .getByRole("button", { name: "Change value for Australia" })
    .click();
  await page.getByLabel("Continent name").fill("Asia");
  await page.getByLabel("Continent name").fill("");
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot();
});

test("Update button is disabled and error message is shown when added name is invalid", async ({
  page
}) => {
  await page
    .getByRole("button", { name: "Change value for Australia" })
    .click();
  await page.getByLabel("Continent name").fill("a".repeat(65));
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot();
});

test("List is shown unchanged when update menu is closed without action", async ({
  page
}) => {
  await page
    .getByRole("button", { name: "Change value for Australia" })
    .click();
  await page.getByLabel("Continent name").fill("Test");
  await page.getByRole("button", { name: "Cancel" }).click();

  await expect(page).toHaveScreenshot();
});

test("All buttons in the update menu are disabled when the update is taking place", async ({
  page
}) => {
  await page
    .getByRole("button", { name: "Change value for Australia" })
    .click();
  await page.getByLabel("Continent name").fill("Australia update test");
  await page.getByRole("button", { name: "Update" }).click();

  await expect(page).toHaveScreenshot();
});

test("List should contain updated values when update menu closes", async ({
  page
}) => {
  await page
    .getByRole("button", { name: "Change value for Australia" })
    .click();
  await page.getByLabel("Continent name").fill("Australia update test");
  await page.getByRole("button", { name: "Update" }).click();
  await expect(
    page.getByRole("gridcell", { name: "Australia update test" })
  ).toHaveCount(1);

  await expect(page).toHaveScreenshot();
});
