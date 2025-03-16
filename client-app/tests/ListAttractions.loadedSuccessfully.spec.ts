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

  await expect(page.getByText("Casino of Monte-Carlo")).toHaveCount(1);
  await expect(page.getByText("Casino of Monte-Carlo")).toBeVisible();
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
  await expect(page.getByText("Casino of Monte-Carlo new")).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Display the edit attraction destination dialog prepopulated with existing data when the edit button in the destination column is clicked", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction destination from Lithuania"
    })
    .click();

  await expect(page).toHaveScreenshot();
});

test("Update button on the edit attraction destination dialog is disabled and error message is shown when region is not selected", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction destination from Lithuania"
    })
    .click();
  await page.getByLabel("Nationally Recognized Attraction").click();
  await page.getByLabel("Select a country").fill("Lith");
  await page.getByRole("menuitem", { name: "Lithuania" }).click();
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot();
});

test("Update button on the edit attraction destination dialog is disabled and error message is shown when country is not selected", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction destination from Lithuania"
    })
    .click();
  await page.getByLabel("Select a region").fill("Mon");
  await page.getByRole("menuitem", { name: "Monaco" }).click();
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot();
});

test("Update button on the edit attraction destination dialog is disabled and error message is shown when region is selected then deselected", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction destination from Lithuania"
    })
    .click();
  await page.getByLabel("Nationally Recognized Attraction").click();
  await page.getByLabel("Select a country").fill("Lith");
  await page.getByRole("menuitem", { name: "Lithuania" }).click();
  await page.getByLabel("Select a region").fill("Mon");
  await page.getByRole("menuitem", { name: "Monaco" }).click();
  await page.getByLabel("Select a region").fill("Monac");
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot();
});

test("Update button on the edit attraction destination dialog is disabled and error message is shown when country is selected then deselected", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction destination from Lithuania"
    })
    .click();
  await page.getByLabel("Nationally Recognized Attraction").click();
  await page.getByLabel("Select a country").fill("Lith");
  await page.getByRole("menuitem", { name: "Lithuania" }).click();
  await page.getByLabel("Select a country").fill("Lithuan");
  await page.getByLabel("Select a region").fill("Mon");
  await page.getByRole("menuitem", { name: "Monaco" }).click();
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot();
});

test("Update button on the edit attraction destination dialog is disabled when city is not selected", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction destination from Lithuania"
    })
    .click();
  await page.getByLabel("Select a country").fill("Lith");
  await page.getByRole("menuitem", { name: "Lithuania" }).click();
  await page.getByLabel("Attraction is region level").click();
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot();
});

test("Update button on the edit attraction destination dialog is enabled when both country and city are selected", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction destination from Lithuania"
    })
    .click();
  await page.getByLabel("Select a country").fill("Lith");
  await page.getByRole("menuitem", { name: "Lithuania" }).click();
  await page.getByLabel("Attraction is region level").click();
  await page.getByLabel("Select a city").fill("Mon");
  await page.getByRole("menuitem", { name: "Monaco, Monaco, Monaco" }).click();
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot();
});

test("Update button on the edit attraction destination dialog is enabled when both country and region are selected", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction destination from Lithuania"
    })
    .click();
  await page.getByLabel("Select a country").fill("Lith");
  await page.getByRole("menuitem", { name: "Lithuania" }).click();
  await page.getByLabel("Select a region").fill("Mon");
  await page.getByRole("menuitem", { name: "Monaco" }).click();
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot();
});

test("List is shown unchanged when update attraction destination is closed without action", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction destination from Lithuania"
    })
    .click();
  await page.getByLabel("Select a country").fill("Lith");
  await page.getByRole("menuitem", { name: "Lithuania" }).click();
  await page.getByLabel("Select a region").fill("Mon");
  await page.getByRole("menuitem", { name: "Monaco" }).click();
  await page.getByRole("button", { name: "Cancel" }).click();

  await expect(
    page.getByRole("gridcell", { name: /Vilnius Old Town$/ })
  ).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("All buttons on the the update attraction destination dialog are disabled when the update is taking place", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction destination from Lithuania"
    })
    .click();
  await page.getByLabel("Select a country").fill("Lith");
  await page.getByRole("menuitem", { name: "Lithuania" }).click();
  await page.getByLabel("Select a region").fill("Mon");
  await page.getByRole("menuitem", { name: "Monaco" }).click();
  await page.getByRole("button", { name: "Update" }).click();

  await expect(page).toHaveScreenshot();
});

test("List should contain updated values when new update attraction destination dialog closes", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction destination from Lithuania"
    })
    .click();
  await page.getByLabel("Select a country").fill("Lith");
  await page.getByRole("menuitem", { name: "Lithuania" }).click();
  await page.getByLabel("Select a region").fill("Mon");
  await page.getByRole("menuitem", { name: "Monaco" }).click();
  await page.getByRole("button", { name: "Update" }).click();

  await expect(
    page.getByRole("gridcell", { name: /Monaco, Monaco/ })
  ).toHaveCount(4);
  await expect(page).toHaveScreenshot();
});

test("List should contain updated values when new update attraction destination dialog closes with new city", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction destination from Lithuania"
    })
    .click();
  await page.getByLabel("Select a country").fill("Lith");
  await page.getByRole("menuitem", { name: "Lithuania" }).click();
  await page.getByLabel("Attraction is region level").click();
  await page.getByLabel("Select a city").fill("Mon");
  await page.getByRole("menuitem", { name: "Monaco, Monaco, Monaco" }).click();
  await page.getByRole("button", { name: "Update" }).click();

  await expect(
    page.getByRole("gridcell", { name: /Monaco, Monaco, Monaco/ })
  ).toHaveCount(2);
  await expect(page).toHaveScreenshot();
});

test("Display the edit attraction address dialog prepopulated with existing data when the edit button in the address column is clicked", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction address from not provide"
    })
    .click();

  await expect(page).toHaveScreenshot();
});

test("Update button on the edit attraction address dialog is disabled and error message is shown when address is too long", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction address from not provide"
    })
    .click();
  await page.getByLabel(/Attraction address$/).fill("A".repeat(513));
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot();
});

test("Update button on the edit attraction address dialog is disabled and error message is shown when geo location doesnt provide both long and lat", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction address from not provide"
    })
    .click();
  await page.getByLabel("Geo location").fill("11.223432");
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot();
});

test("List is shown unchanged when update attraction address is closed without action", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction address from not provide"
    })
    .click();
  await page.getByLabel(/Attraction address$/).fill("Test address 123");
  await page.getByLabel("Geo location").fill("11.223432, -12.32342");
  await page.getByRole("button", { name: "Cancel" }).click();

  await expect(
    page.getByRole("gridcell", { name: /Vilnius Old Town$/ })
  ).toHaveCount(1);
  await expect(page).toHaveScreenshot();
});

test("All buttons on the the update attraction address dialog are disabled when the update is taking place", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction address from not provide"
    })
    .click();
  await page.getByLabel(/Attraction address$/).fill("Test address 123");
  await page.getByLabel("Geo location").fill("11.223432, -12.32342");
  await page.getByRole("button", { name: "Update" }).click();

  await expect(page).toHaveScreenshot();
});

test("List should contain no address when update attraction address dialog closes with empty values", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction address from Pl. du Casino, 98000 Monaco"
    })
    .nth(1)
    .click();
  await page.getByRole("button", { name: "Update" }).click();

  await expect(page.getByText("Modifying")).toHaveCount(0);
  await expect(page.getByText("Pl. du Casino, 98000 Monaco")).toHaveCount(1);
  await expect(page).toHaveScreenshot();
});

test("List should contain updated attraction address when new address is given", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction address from not provide"
    })
    .click();
  await page.getByLabel(/Attraction address$/).fill("Test address 123");
  await page.getByLabel("Geo location").fill("11.223432, -12.32342");
  await page.getByRole("button", { name: "Update" }).click();

  await expect(
    page.getByRole("gridcell", { name: "Test address 123" })
  ).toHaveCount(1);
  await expect(page).toHaveScreenshot();
});

test("Display the edit attraction category dialog prepopulated with existing data when the edit button in the category column is clicked", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction category from HISTORIC_SITE"
    })
    .click();

  await expect(page).toHaveScreenshot();
});

test("List is shown unchanged when update attraction category is closed without action", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction category from HISTORIC_SITE"
    })
    .click();
  await page.getByRole("button", { name: "Cancel" }).click();

  await expect(
    page.getByRole("gridcell", { name: /Vilnius Old Town$/ })
  ).toHaveCount(1);
  await expect(page).toHaveScreenshot();
});

test("List should contain updated values when new attraction category dialog closes", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction category from HISTORIC_SITE"
    })
    .click();
  await page.getByRole("combobox", { name: "Attraction category" }).click();
  await page.getByRole("option", { name: "OTHER_LANDMARK" }).click();
  await page.getByRole("button", { name: "Update" }).click();

  await expect(
    page.getByRole("gridcell", { name: /OTHER_LANDMARK$/ })
  ).toHaveCount(1);
  await expect(page).toHaveScreenshot();
});

test("Display the edit attraction type dialog when the edit button in the type column is clicked", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction type from POTENTIAL_CHANGE"
    })
    .click();

  await expect(page).toHaveScreenshot();
});

test("List is shown unchanged when update attraction type is closed without action", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction type from POTENTIAL_CHANGE"
    })
    .click();
  await page.getByRole("button", { name: "Cancel" }).click();

  await expect(
    page.getByRole("gridcell", { name: /Vilnius Old Town$/ })
  ).toHaveCount(1);
  await expect(page).toHaveScreenshot();
});

test("List should contain updated values when new attraction type dialog closes", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction type from POTENTIAL_CHANGE"
    })
    .click();
  await page.getByRole("combobox", { name: "Attraction type" }).click();
  await page.getByRole("option", { name: "IMMINENT_CHANGE" }).click();
  await page.getByRole("button", { name: "Update" }).click();

  await expect(page.getByText("Modifying")).toHaveCount(0);
  await expect(page.getByText("IMMINENT_CHANGE")).toHaveCount(1);
  await expect(page.getByText("IMMINENT_CHANGE")).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Display the edit attraction must visit dialog when the edit button in the type column is clicked", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction visit preferences for Larvotto Beach to must visit"
    })
    .click();

  await expect(page).toHaveScreenshot();
});

test("List is shown unchanged when update attraction must visit is closed without action", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction visit preferences for Larvotto Beach to must visit"
    })
    .click();
  await page.getByRole("button", { name: "Cancel" }).click();

  await expect(
    page.getByRole("gridcell", { name: /Vilnius Old Town$/ })
  ).toHaveCount(1);
  await expect(page).toHaveScreenshot();
});

test("List should contain updated values when new attraction must visit dialog closes", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction visit preferences for Larvotto Beach to must visit"
    })
    .click();
  await page.getByRole("button", { name: "Update" }).click();

  await expect(page.getByText("Modifying")).toHaveCount(0);
  await expect(
    page.getByRole("button", {
      name: "Change attraction visit preferences for Larvotto Beach to must visit"
    })
  ).toHaveCount(0);
  await expect(page.getByText("Casino of Monte-Carlo")).toHaveCount(1);
  await expect(page.getByText("Casino of Monte-Carlo")).toBeVisible();
  await expect(page).toHaveScreenshot();
});
