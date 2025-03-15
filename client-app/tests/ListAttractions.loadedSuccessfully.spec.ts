import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-continent-pages-list-attraction-listattraction--primary"
  );

  await page.waitForSelector('div[data-automationid="DetailsList"]');
  await expect(
    page.getByRole("gridcell", { name: /Vilnius Old Town$/ })
  ).toBeVisible();
});

test("Show list of attractions with disabled delete button when no element is selected ", async ({
  page
}) => {
  await expect(page).toHaveScreenshot();
});

test("Select attraction when clicked on the check icon", async ({ page }) => {
  await page
    .locator('div[data-list-index="2"]')
    .getByRole("radio", { name: "select row" })
    .click();

  await expect(page).toHaveScreenshot();
});

test("Select attraction when click on the row", async ({ page }) => {
  await page.getByRole("gridcell", { name: /Vilnius Old Town$/ }).click();

  await expect(page).toHaveScreenshot();
});

test("List should be ordered ascending when sorted by oldest", async ({
  page
}) => {
  await page.getByRole("combobox").click();
  await page.getByRole("option", { name: "Oldest" }).click();
  await expect(
    page
      .locator('div[data-selection-index="2"]')
      .getByRole("gridcell", { name: /Larvotto Beach$/ })
  ).toHaveCount(1);

  await expect(page).toHaveScreenshot();
});

test("All delete menu buttons are enabled when open it", async ({ page }) => {
  await page.getByRole("gridcell", { name: /Larvotto Beach$/ }).click();
  await page.getByRole("menuitem", { name: "Delete attraction" }).click();

  await expect(page).toHaveScreenshot();
});

test("All elements should be present when canceling delete menu", async ({
  page
}) => {
  await page.getByRole("gridcell", { name: /Larvotto Beach$/ }).click();
  await page.getByRole("menuitem", { name: "Delete attraction" }).click();
  await page.getByRole("button", { name: "Cancel" }).click();
  await page.getByRole("gridcell", { name: /Larvotto Beach$/ }).click();

  await expect(page).toHaveScreenshot();
});

test("All buttons on delete menu are disabled when delete request is sent", async ({
  page
}) => {
  await page.getByRole("gridcell", { name: /Larvotto Beach$/ }).click();
  await page.getByRole("menuitem", { name: "Delete attraction" }).click();
  await page.getByRole("button", { name: "Delete" }).click();

  await expect(page).toHaveScreenshot();
});

test("List should not contain previously deleted element when delete menu closes", async ({
  page
}) => {
  await page.getByRole("gridcell", { name: /Larvotto Beach$/ }).click();
  await page.getByRole("menuitem", { name: "Delete attraction" }).click();
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(0);
  await expect(
    page.getByRole("gridcell", { name: "Larvotto Beach" })
  ).toHaveCount(0);
  await expect(
    page
      .locator('div[data-selection-index="2"]')
      .getByRole("gridcell", { name: /Casino of Monte-Carlo$/ })
  ).toHaveCount(1);

  await expect(page).toHaveScreenshot();
});

test("Display the edit attraction name dialog prepopulated with existing data when the edit button in the name column is clicked", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction details from Vilnius Old Town"
    })
    .click();

  await expect(page).toHaveScreenshot();
});

test("Update button on the edit attraction name dialog is disabled and error message is shown when added name is empty", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction details from Vilnius Old Town"
    })
    .click();
  await page.getByLabel("Attraction name").fill("A");
  await page.getByLabel("Attraction name").fill("");
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot();
});

test("Update button on the edit attraction name dialog is disabled and error message is shown when added name is invalid", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction details from Vilnius Old Town"
    })
    .click();
  await page.getByLabel("Attraction name").fill("A".repeat(2049));
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot();
});

test("Update button on the edit attraction name dialog is disabled and error message is shown when added name is empty and main attraction is selected", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction details from Vilnius Old Town"
    })
    .click();
  await page.getByLabel("Attraction name").fill("A");
  await page.getByLabel("Attraction name").fill("");
  await page.getByLabel("Part of attraction").click();
  await page.getByLabel("Select main attraction name").fill("Cas");
  await page.getByRole("menuitem", { name: "Casino of Monte-Carlo" }).click();
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot();
});

test("List is shown unchanged when update attraction name is closed without action", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction details from Vilnius Old Town"
    })
    .click();
  await page.getByLabel("Attraction name").fill("A".repeat(2049));
  await page.getByRole("button", { name: "Cancel" }).click();

  await expect(page).toHaveScreenshot();
});

test("All buttons on the the update attraction name dialog are disabled when the update is taking place", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction details from Vilnius Old Town"
    })
    .click();
  await page.getByLabel("Attraction name").fill("Vilnius Old Town new");
  await page.getByRole("button", { name: "Update" }).click();

  await expect(page).toHaveScreenshot();
});

test("List should contain updated values when new update attraction name dialog closes", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction details from Vilnius Old Town"
    })
    .click();
  await page.getByLabel("Attraction name").fill("Vilnius Old Town new");
  await page.getByLabel("Part of attraction").click();
  await page.getByLabel("Select main attraction name").fill("Cas");
  await page.getByRole("menuitem", { name: "Casino of Monte-Carlo" }).click();

  await page.getByRole("button", { name: "Update" }).click();

  await expect(page.getByText("Vilnius Old Town new")).toHaveCount(1);
  await expect(page).toHaveScreenshot();
});

test("List should contain updated values without main attraction when only new attraction name is given and dialog closes", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction details from Casino of Monte-Carlo"
    })
    .click();
  await page.getByLabel("Attraction name").fill("Casino of Monte-Carlo new");

  await page.getByRole("button", { name: "Update" }).click();

  await expect(page.getByText("Casino of Monte-Carlo new")).toHaveCount(1);
  await expect(page).toHaveScreenshot();
});
