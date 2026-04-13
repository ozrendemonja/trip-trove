import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-my-trip-mytriplist--with-trips"
  );

  await expect(page.getByText("Italy")).toBeVisible();
});

test("Show list of trips when loaded", async ({ page }) => {
  await expect(page).toHaveScreenshot();
});

test("Show delete confirmation dialog when delete button is clicked", async ({
  page
}) => {
  await page.getByLabel("Delete trip").first().click();

  await expect(page.getByText("Delete Italy")).toBeVisible();
  await expect(
    page.getByText("Are you sure you want to delete Italy?")
  ).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("All elements should be present when canceling delete dialog", async ({
  page
}) => {
  await page.getByLabel("Delete trip").first().click();
  await page.getByRole("button", { name: "Cancel" }).click();

  await expect(page.getByText("Italy")).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Trip should not be present after confirming delete", async ({ page }) => {
  await page.getByLabel("Delete trip").first().click();
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(0);

  await expect(page.getByText("Italy")).toHaveCount(0);
  await expect(page).toHaveScreenshot();
});

test("Show edit dialog with prepopulated data when edit button is clicked", async ({
  page
}) => {
  await page.getByLabel("Edit trip").first().click();

  await expect(page.getByText("Edit Italy")).toBeVisible();
  await expect(page.getByLabel("Trip name")).toHaveValue("Italy");
  await expect(page.getByLabel("Start date")).toHaveValue("2026-06-10");
  await expect(page.getByLabel("End date")).toHaveValue("2026-06-24");
  await expect(page).toHaveScreenshot();
});

test("Update button is disabled when trip name is cleared", async ({
  page
}) => {
  await page.getByLabel("Edit trip").first().click();
  await page.getByLabel("Trip name").clear();

  await expect(page.getByRole("button", { name: "Update" })).toBeDisabled();
  await expect(page).toHaveScreenshot();
});

test("Trip name is updated after editing", async ({ page }) => {
  await page.getByLabel("Edit trip").first().click();
  await page.getByLabel("Trip name").clear();
  await page.getByLabel("Trip name").fill("Italy 2026");
  await page.getByRole("button", { name: "Update" }).click();

  await expect(page.getByText("Italy 2026")).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Edit dialog is closed when cancel icon is clicked", async ({ page }) => {
  await page.getByLabel("Edit trip").first().click();
  await expect(page.getByText("Edit Italy")).toBeVisible();

  await page.getByLabel("Close modify popup").click();

  await expect(page.getByText("Edit Italy")).toHaveCount(0);
  await expect(page).toHaveScreenshot();
});

test("Show create trip dialog with Create button when New Trip is clicked", async ({
  page
}) => {
  await page.getByRole("button", { name: "New Trip" }).click();

  await expect(page.getByText("Create new Trip")).toBeVisible();
  await expect(page.getByRole("button", { name: "Create" })).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Create button is disabled when trip name is empty", async ({ page }) => {
  await page.getByRole("button", { name: "New Trip" }).click();

  await expect(page.getByRole("button", { name: "Create" })).toBeDisabled();
  await expect(page).toHaveScreenshot();
});

test("New trip appears after creating it", async ({ page }) => {
  await page.getByRole("button", { name: "New Trip" }).click();
  await page.getByLabel("Trip name").fill("Greece 2026");
  await page.getByLabel("Start date").fill("2026-08-01");
  await page.getByLabel("End date").fill("2026-08-15");
  await page.getByRole("button", { name: "Create" }).click();

  await expect(page.getByText("Greece 2026")).toBeVisible();
  await expect(page).toHaveScreenshot();
});
