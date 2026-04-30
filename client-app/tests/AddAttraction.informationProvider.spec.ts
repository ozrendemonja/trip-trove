import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-continent-pages-add-attraction-addattraction--primary"
  );

  await page.getByRole("heading", { name: "Add Attraction" });
});

test("Suggestions for information provider are shown when at least 3 characters are typed", async ({
  page
}) => {
  await page.getByLabel("Where information comes from").fill("Lon");

  await expect(
    page.getByRole("menuitem", { name: "Lonely Planet" })
  ).toBeVisible();
});

test("Information provider value is filled when a suggestion is clicked", async ({
  page
}) => {
  await page.getByLabel("Where information comes from").fill("Trip");
  await page.getByRole("menuitem", { name: "Tripadvisor" }).click();

  await expect(page.getByLabel("Where information comes from")).toHaveValue(
    "Tripadvisor"
  );
});

test("No suggestions are shown when query is shorter than 3 characters", async ({
  page
}) => {
  await page.getByLabel("Where information comes from").fill("Lo");

  await expect(
    page.getByRole("menuitem", { name: "Lonely Planet" })
  ).toHaveCount(0);
});

test("No suggestions are shown when no information provider matches the query", async ({
  page
}) => {
  await page
    .getByLabel("Where information comes from")
    .fill("zzz-no-match-zzz");

  await expect(page.getByRole("menuitem")).toHaveCount(0);
});

test("Free-text value is kept as-is when no suggestion is selected", async ({
  page
}) => {
  await page
    .getByLabel("Where information comes from")
    .fill("Brand new source");
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page.getByLabel("Where information comes from")).toHaveValue(
    "Brand new source"
  );
});

test("Suggestion list is filtered by the typed query", async ({ page }) => {
  await page.getByLabel("Where information comes from").fill("Goo");

  await expect(
    page.getByRole("menuitem", { name: "Google reviews" })
  ).toBeVisible();
  await expect(
    page.getByRole("menuitem", { name: "Lonely Planet" })
  ).toHaveCount(0);
  await expect(
    page.getByRole("menuitem", { name: "Tripadvisor" })
  ).toHaveCount(0);
});
