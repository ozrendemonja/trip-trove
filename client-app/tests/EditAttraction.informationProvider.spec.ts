import { test, expect, Page } from "@playwright/test";

const selectRecordedDate = async (page: Page): Promise<void> => {
  await page
    .getByRole("combobox", { name: "Date of information recording" })
    .click();
  const today = new Date();
  await page
    .getByRole("button", {
      name: `${today.getDate()}, ${today.toLocaleString("en-US", {
        month: "long"
      })}, ${today.getFullYear()}`,
      exact: true
    })
    .click();
};

test.beforeEach(async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-continent-pages-list-attraction-listattraction--primary"
  );

  await page.getByRole("grid", { name: "Item details" }).waitFor();
  await expect(
    page.getByRole("link", { name: "Vilnius Old Town", exact: true })
  ).toBeVisible();
});

test("Suggestions for information provider are shown when editing info from", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction info from Google reviews"
    })
    .click();
  await page.getByLabel("Where information comes from").fill("Lon");

  await expect(
    page.getByRole("menuitem", { name: "Lonely Planet" })
  ).toBeVisible();
});

test("Information provider is updated when an existing suggestion is selected", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction info from Google reviews"
    })
    .click();
  await page.getByLabel("Where information comes from").fill("Lon");
  await page.getByRole("menuitem", { name: "Lonely Planet" }).click();
  await selectRecordedDate(page);
  await page.getByRole("button", { name: "Update" }).click();

  await expect(
    page.getByRole("button", {
      name: "Change attraction info from Lonely Planet"
    })
  ).toHaveCount(3);
});

test("Information provider is updated with a brand new free-text value when no suggestion matches", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction info from Google reviews"
    })
    .click();
  await page
    .getByLabel("Where information comes from")
    .fill("Brand new source");
  await selectRecordedDate(page);
  await page.getByRole("button", { name: "Update" }).click();

  await expect(
    page.getByRole("button", {
      name: "Change attraction info from Brand new source"
    })
  ).toBeVisible();
});

test("Suggestions menu is empty when no information provider matches the query", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction info from Google reviews"
    })
    .click();
  await page
    .getByLabel("Where information comes from")
    .fill("zzz-no-match-zzz");

  await expect(page.getByRole("menuitem")).toHaveCount(0);
});
