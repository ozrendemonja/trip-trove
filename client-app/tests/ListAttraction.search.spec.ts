import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-continent-pages-list-attraction-listattraction--primary"
  );

  await page.getByRole("grid", { name: "Item details" }).waitFor();
  await expect(
    page.getByRole("button", {
      name: "Change attraction details from Vilnius Old Town"
    })
  ).toBeVisible();
});

test("Search dropdown displays all elements where the search value is a substring", async ({
  page
}) => {
  await page.getByRole("searchbox", { name: "Search" }).fill("Cas");
  await expect(
    page.getByRole("menuitem", { name: "Casino of Monte-Carlo" })
  ).toHaveCount(1);
  await expect(
    page.getByRole("menuitem", { name: "Casino Square" })
  ).toHaveCount(1);

  await expect(page).toHaveScreenshot();
});

test.describe("Edit modal suggestion dropdowns", () => {
  test.use({ viewport: { width: 2560, height: 1200 } });

  test("Country search suggestions appear while editing a destination", async ({
    page
  }) => {
    await page
      .getByRole("button", {
        name: "Change attraction destination from Lithuania"
      })
      .click();
    await expect(
      page.getByRole("heading", { name: "Modifying Lithuania" })
    ).toBeVisible();

    await page.getByLabel("Select a country").fill("Lith");

    await expect(
      page.getByRole("menuitem", { name: "Lithuania" })
    ).toBeVisible();
    await expect(page).toHaveScreenshot();
  });

  test("City search suggestions appear while editing a destination", async ({
    page
  }) => {
    await page
      .getByRole("button", {
        name: "Change attraction destination from Lithuania"
      })
      .click();
    await expect(
      page.getByRole("heading", { name: "Modifying Lithuania" })
    ).toBeVisible();

    await page.getByLabel("Attraction is region level").click();
    await page.getByLabel("Select a city").fill("Mon");

    await expect(
      page.getByRole("menuitem", { name: "Monaco, Monaco, Monaco" })
    ).toBeVisible();
    await expect(page).toHaveScreenshot();
  });

  test("Information source suggestions appear while editing attraction info", async ({
    page
  }) => {
    await page
      .getByRole("button", {
        name: "Change attraction info from Google reviews"
      })
      .click();
    await expect(page.getByLabel("Where information comes from")).toBeVisible();

    await page.getByLabel("Where information comes from").fill("Lonely");
    await expect(
      page.getByRole("menuitem", { name: "Lonely Planet" })
    ).toBeVisible();
    await expect(page).toHaveScreenshot();
  });
});
