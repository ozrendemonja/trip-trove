import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-continent-pages-list-attraction-listattraction--primary"
  );

  await page.waitForSelector('div[data-automationid="DetailsList"]');
  await expect(
    page.getByRole("gridcell", { name: "Vilnius Old Town" })
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
  await page.getByRole("gridcell", { name: "Vilnius Old Town" }).click();

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
      .getByRole("gridcell", { name: "Larvotto Beach" })
  ).toHaveCount(1);

  await expect(page).toHaveScreenshot();
});

test("All delete menu buttons are enabled when open it", async ({ page }) => {
  await page.getByRole("gridcell", { name: "Larvotto Beach" }).click();
  await page.getByRole("menuitem", { name: "Delete attraction" }).click();

  await expect(page).toHaveScreenshot();
});

test("All elements should be present when canceling delete menu", async ({
  page
}) => {
  await page.getByRole("gridcell", { name: "Larvotto Beach" }).click();
  await page.getByRole("menuitem", { name: "Delete attraction" }).click();
  await page.getByRole("button", { name: "Cancel" }).click();
  await page.getByRole("gridcell", { name: "Larvotto Beach" }).focus();

  await expect(page).toHaveScreenshot();
});

test("All buttons on delete menu are disabled when delete request is sent", async ({
  page
}) => {
  await page.getByRole("gridcell", { name: "Larvotto Beach" }).click();
  await page.getByRole("menuitem", { name: "Delete attraction" }).click();
  await page.getByRole("button", { name: "Delete" }).click();

  await expect(page).toHaveScreenshot();
});

test("List should not contain previously deleted element when delete menu closes", async ({
  page
}) => {
  await page.getByRole("gridcell", { name: "Larvotto Beach" }).click();
  await page.getByRole("menuitem", { name: "Delete attraction" }).click();
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(0);
  await expect(
    page.getByRole("gridcell", { name: "Larvotto Beach" })
  ).toHaveCount(0);
  await expect(
    page
      .locator('div[data-selection-index="2"]')
      .getByRole("gridcell", { name: "Casino of Monte-Carlo" })
  ).toHaveCount(1);

  await expect(page).toHaveScreenshot();
});

// test("Display the edit city name dialog prepopulated with existing data when the edit button in the name column is clicked", async ({
//   page
// }) => {
//   await page
//     .getByRole("button", { name: "Change city name for Kaunas" })
//     .click();

//   await expect(page).toHaveScreenshot();
// });

// test("Update button on the the edit city name dialog is disabled and error message is shown when added name is empty", async ({
//   page
// }) => {
//   await page
//     .getByRole("button", { name: "Change city name for Kaunas" })
//     .click();
//   await page.getByLabel("City name", { exact: true }).fill("Alytus");
//   await page.getByLabel("City name", { exact: true }).fill("");
//   await page.getByRole("button", { name: "Cancel" }).focus();

//   await expect(page).toHaveScreenshot();
// });

// test("Update button on the the edit city name is disabled and error message is shown when added name is invalid", async ({
//   page
// }) => {
//   await page
//     .getByRole("button", { name: "Change city name for Kaunas" })
//     .click();
//   await page.getByLabel("City name", { exact: true }).fill("a".repeat(257));
//   await page.getByRole("button", { name: "Cancel" }).focus();

//   await expect(page).toHaveScreenshot();
// });

// test("List is shown unchanged when update menu is closed without action", async ({
//   page
// }) => {
//   await page
//     .getByRole("button", { name: "Change city name for Kaunas" })
//     .click();
//   await page.getByLabel("City name", { exact: true }).fill("Test");
//   await page.getByRole("button", { name: "Cancel" }).click();

//   await expect(page).toHaveScreenshot();
// });

// test("All buttons on the the edit city name dialog are disabled when the update is taking place", async ({
//   page
// }) => {
//   await page
//     .getByRole("button", { name: "Change city name for Kaunas" })
//     .click();
//   await page.getByLabel("City name", { exact: true }).fill("Alytus");
//   await page.getByRole("button", { name: "Update" }).click();

//   await expect(page).toHaveScreenshot();
// });

// test("List should contain updated values when edit city name dialog closes", async ({
//   page
// }) => {
//   await page
//     .getByRole("button", { name: "Change city name for Kaunas" })
//     .click();
//   await page.getByLabel("City name", { exact: true }).fill("Alytus");
//   await page.getByRole("button", { name: "Update" }).click();
//   await expect(
//     page.getByRole("gridcell", {
//       name: "Change city name for Alytus"
//     })
//   ).toHaveCount(1);

//   await expect(page).toHaveScreenshot();
// });

// test("Display the edit region name dialog prepopulated with existing data when the edit button in the region column is clicked", async ({
//   page
// }) => {
//   page
//     .locator('div[data-selection-index="1"]')
//     .getByRole("button", {
//       name: "Change region name from Aukštaitija"
//     })
//     .click();

//   await expect(page).toHaveScreenshot();
// });

// test("List is shown unchanged when edit region name is closed without action", async ({
//   page
// }) => {
//   page
//     .locator('div[data-selection-index="1"]')
//     .getByRole("button", {
//       name: "Change region name from Aukštaitija"
//     })
//     .click();
//   await page.getByLabel("Select a region").fill("Dzūkija");
//   await page.getByRole("button", { name: "Cancel" }).click();

//   await expect(page).toHaveScreenshot();
// });

// test("All buttons on the the edit region name dialog are disabled when the update is taking place", async ({
//   page
// }) => {
//   page
//     .locator('div[data-selection-index="1"]')
//     .getByRole("button", {
//       name: "Change region name from Aukštaitija"
//     })
//     .click();
//   await page.getByLabel("Select a region").fill("Sam");
//   await page.getByRole("menuitem", { name: "Samogitia" }).click();
//   await page.getByRole("button", { name: "Update" }).click();

//   await expect(page).toHaveScreenshot();
// });

// test("Update button in the edit region name dialog is disabled and error message is shown when user chose a name and then change the value", async ({
//   page
// }) => {
//   page
//     .locator('div[data-selection-index="1"]')
//     .getByRole("button", {
//       name: "Change region name from Aukštaitija"
//     })
//     .click();
//   await page.getByLabel("Select a region").fill("Sam");
//   await page.getByRole("menuitem", { name: "Samogitia" }).click();
//   await page.getByLabel("Select a region").fill("Samogiti");

//   await expect(page).toHaveScreenshot();
// });

// test("List should contain updated values when edit region name dialog closes", async ({
//   page
// }) => {
//   page
//     .locator('div[data-selection-index="1"]')
//     .getByRole("button", {
//       name: "Change region name from Aukštaitija"
//     })
//     .click();
//   await page.getByLabel("Select a region").fill("Sam");
//   await page.getByRole("menuitem", { name: "Samogitia" }).click();
//   await page.getByRole("button", { name: "Update" }).click();
//   await expect(
//     page.getByRole("gridcell", {
//       name: "Samogitia"
//     })
//   ).toHaveCount(2);

//   await expect(page).toHaveScreenshot();
// });
