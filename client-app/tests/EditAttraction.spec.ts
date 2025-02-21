import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-continent-pages-list-attraction-listattraction--primary"
  );

  await page.waitForSelector('div[data-automationid="DetailsList"]');
  await expect(
    page.getByRole("link", { name: "Vilnius Old Town", exact: true })
  ).toBeVisible();
});

test("Update button is disabled when no attraction name is provided ", async ({
  page
}) => {
  await page
    .getByLabel("Change attraction details from Vilnius Old Town")
    .click();

  await expect(page).toHaveScreenshot();
});

test("Edit Name form is shown when changed attraction name is called ", async ({
  page
}) => {
  await page
    .getByLabel("Change attraction details from Vilnius Old Town")
    .click();
  await page.getByLabel("Part of attraction").check();

  await expect(page).toHaveScreenshot();
});

test("Name is canged when new name is provided ", async ({ page }) => {
  await page
    .getByLabel("Change attraction details from Vilnius Old Town")
    .click();
  await page.getByLabel("Attraction name").fill("Uzupis");
  await page.getByRole("button", { name: "Update" }).click();

  await expect(
    page.getByRole("link", {
      name: "Uzupis",
      exact: true
    })
  ).toHaveCount(1);
  await expect(page).toHaveScreenshot();
});

test("Name is canged and main name is added when new ones are provided ", async ({
  page
}) => {
  await page
    .getByLabel("Change attraction details from Vilnius Old Town")
    .click();
  await page.getByLabel("Attraction name").fill("One Monte-Carlo");
  await page.getByLabel("Part of attraction").check();
  await page.getByLabel("Select main attraction name").fill("Cas");
  await page.getByRole("menuitem", { name: "Casino Square" }).click();
  await page.getByRole("button", { name: "Update" }).click();

  await expect(
    page.getByRole("link", {
      name: "One Monte-Carlo"
    })
  ).toHaveCount(1);
  await expect(page).toHaveScreenshot();
});

test("Name is canged and main name is removed when only attraction name is provided ", async ({
  page
}) => {
  await page
    .getByLabel("Change attraction details from Casino of Monte-Carlo")
    .click();
  await page.getByLabel("Attraction name").fill("Uzupis");
  await page.getByRole("button", { name: "Update" }).click();

  await expect(
    page.getByRole("link", {
      name: "Uzupis"
    })
  ).toHaveCount(1);
  await expect(page).toHaveScreenshot();
});

test("Country and region are changed when new region is provided ", async ({
  page
}) => {
  await page.getByLabel("Change attraction destination from Lithuania").click();
  await page.getByLabel("Select a country").fill("Mon");
  await page.getByRole("menuitem", { name: "Monaco" }).click();
  await page.getByLabel("Select a region").fill("Mon");
  await page.getByRole("menuitem", { name: "Monaco" }).click();
  await page.getByRole("button", { name: "Update" }).click();

  await expect(
    page.getByRole("gridcell", {
      name: "Monaco, Monaco"
    })
  ).toHaveCount(4);
  await expect(page).toHaveScreenshot();
});

test("Country, region and city are changed when new city is provided ", async ({
  page
}) => {
  await page.getByLabel("Change attraction destination from Lithuania").click();
  await page.getByLabel("Select a country").fill("Mon");
  await page.getByRole("menuitem", { name: "Monaco" }).click();
  await page.getByLabel("Attraction is region level").check();
  await page.getByLabel("Select a city").fill("Mon");
  await page.getByRole("menuitem", { name: "Monaco, Monaco, Monaco" }).click();
  await page.getByRole("button", { name: "Update" }).click();

  await expect(
    page.getByRole("gridcell", {
      name: "Monaco, Monaco, Monaco"
    })
  ).toHaveCount(2);
  await expect(page).toHaveScreenshot();
});

test("Update button is disabled when no region is provided ", async ({
  page
}) => {
  await page.getByLabel("Change attraction destination from Lithuania").click();
  await page.getByLabel("Select a country").fill("Mon");
  await page.getByRole("menuitem", { name: "Monaco" }).click();

  await expect(page).toHaveScreenshot();
});

test("Attraction address is changed when new address is provided ", async ({
  page
}) => {
  await page.getByLabel("Change attraction address from not provide").click();
  await page
    .getByRole("textbox", { name: "Attraction address" })
    .fill("Universiteto g. 3");
  await page.getByRole("button", { name: "Update" }).click();

  await expect(
    page.getByRole("gridcell", {
      name: "Universiteto g. 3"
    })
  ).toHaveCount(1);
  await expect(page).toHaveScreenshot();
});

test("Geo location is changed when new location is provided ", async ({
  page
}) => {
  await page.getByLabel("Change attraction address from not provide").click();
  await page
    .getByRole("textbox", { name: "Geo location" })
    .fill("54.6825757,25.2876469");
  await page.getByRole("button", { name: "Update" }).click();

  await expect(
    page.getByLabel("Change attraction address from 54.6825757")
  ).toHaveCount(1);
  await expect(page).toHaveScreenshot();
});

test("Geo location and address changed when new location and address are provided ", async ({
  page
}) => {
  await page.getByLabel("Change attraction address from not provide").click();
  await page
    .getByRole("textbox", { name: "Attraction address" })
    .fill("Universiteto g. 3");
  await page
    .getByRole("textbox", { name: "Geo location" })
    .fill("54.6825757,25.2876469");
  await page.getByRole("button", { name: "Update" }).click();

  await expect(
    page.getByLabel("Change attraction address from Universiteto g. 3")
  ).toHaveCount(1);
  await expect(page).toHaveScreenshot();
});

test("Update button is disabled when no category is selected ", async ({
  page
}) => {
  await page
    .getByLabel("Change attraction category from HISTORIC_SITE")
    .click();

  await expect(page).toHaveScreenshot();
});

test("Category is changed when new category is selected ", async ({ page }) => {
  await page
    .getByLabel("Change attraction category from HISTORIC_SITE")
    .click();
  await page.getByRole("combobox", { name: "Attraction category" }).click();
  await page
    .getByRole("option", { name: "POINT_OF_INTEREST_AND_LANDMARK" })
    .click();
  await page.getByRole("button", { name: "Update" }).click();

  await expect(
    page.getByRole("gridcell", {
      name: "POINT_OF_INTEREST_AND_LANDMARK"
    })
  ).toHaveCount(3);
  await expect(page).toHaveScreenshot();
});

test("Update button is disabled when no type is selected ", async ({
  page
}) => {
  await page.getByLabel("Change attraction type from POTENTIAL_CHANGE").click();

  await expect(page).toHaveScreenshot();
});

test("Type is changed when new category is selected", async ({ page }) => {
  await page.getByLabel("Change attraction type from POTENTIAL_CHANGE").click();
  await page.getByRole("combobox", { name: "Attraction type" }).click();
  await page.getByRole("option", { name: "STABLE" }).click();
  await page.getByRole("button", { name: "Update" }).click();

  await expect(page.getByRole("gridcell", { name: "STABLE" })).toHaveCount(4);
  await expect(page).toHaveScreenshot();
});

test("Optional visit priority is set when must visit is diselected", async ({
  page
}) => {
  await page
    .getByLabel(
      "Change attraction visit preferences for Vilnius Old Town to optional visit"
    )
    .click();
  await page.getByRole("button", { name: "Update" }).click();

  await expect(
    page.getByLabel(
      "Change attraction visit preferences for Vilnius Old Town to must visit"
    )
  ).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Must visit priority is set when optional visit is diselected", async ({
  page
}) => {
  await page
    .getByLabel(
      "Change attraction visit preferences for Larvotto Beach to must visit"
    )
    .click();
  await page.getByRole("button", { name: "Update" }).click();

  await expect(
    page.getByLabel(
      "Change attraction visit preferences for Larvotto Beach to optional visit"
    )
  ).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Traditional visit priority is set when not traditional is diselected", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction traditional preferences for Vilnius Old Town to non traditional"
    })
    .click();
  await page.getByRole("button", { name: "Update" }).click();

  await expect(
    page.getByRole("button", {
      name: "Change attraction traditional preferences for Vilnius Old Town to traditional"
    })
  ).toHaveCount(1);
  await expect(page).toHaveScreenshot();
});

test("Not traditional is set when traditional visit is diselected", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction traditional preferences for Larvotto Beach to traditional"
    })
    .click();
  await page.getByRole("button", { name: "Update" }).click();

  await expect(
    page.getByRole("button", {
      name: "Change attraction traditional preferences for Larvotto Beach to non traditional"
    })
  ).toHaveCount(1);
  await expect(page).toHaveScreenshot();
});

test("Update button is disabled when info from is provided", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction info from Google reviews"
    })
    .click();

  await expect(page).toHaveScreenshot();
});

test("Update button is disabled when only info from is provided", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction info from Google reviews"
    })
    .click();
  await page.getByLabel("Where information comes from").fill("Lonely Planet");

  await expect(page).toHaveScreenshot();
});

test("Update button is disabled when only info recorded is provided", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction info from Google reviews"
    })
    .click();
  await page
    .getByRole("combobox", { name: "Select recorded date..." })
    .fill("Mon Feb 17 2025");

  await expect(page).toHaveScreenshot();
});

test("Info from is changed when info from and recorded is provided", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction info from Google reviews"
    })
    .click();
  await page
    .getByRole("combobox", { name: "Select recorded date..." })
    .fill("Mon Feb 17 2025");
  await page.getByLabel("Where information comes from").fill("Lonely Planet");
  await page.getByRole("button", { name: "Update" }).click();

  await expect(
    page.getByRole("button", {
      name: "Change attraction info from Lonely Planet"
    })
  ).toHaveCount(3);
  await expect(page).toHaveScreenshot();
});
