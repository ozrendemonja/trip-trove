import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-my-trip-edittripdetails--default"
  );

  await expect(page.getByText("Edit Italy")).toBeVisible();
});

test("Show edit dialog with prepopulated trip data", async ({ page }) => {
  await expect(page.getByLabel("Trip name")).toHaveValue("Italy");
  await expect(page.getByLabel("Start date")).toHaveValue("2026-06-10");
  await expect(page.getByLabel("End date")).toHaveValue("2026-06-24");
  await expect(page).toHaveScreenshot();
});

test("Update button is disabled when trip name is cleared", async ({
  page
}) => {
  await page.getByLabel("Trip name").clear();

  await expect(page.getByRole("button", { name: "Update" })).toBeDisabled();
  await expect(page).toHaveScreenshot();
});

test("Update button is disabled when start date is cleared", async ({
  page
}) => {
  await page.getByLabel("Start date").fill("");

  await expect(page.getByRole("button", { name: "Update" })).toBeDisabled();
  await expect(page).toHaveScreenshot();
});

test("Update button is disabled when end date is cleared", async ({ page }) => {
  await page.getByLabel("End date").fill("");

  await expect(page.getByRole("button", { name: "Update" })).toBeDisabled();
  await expect(page).toHaveScreenshot();
});

test("Update button is enabled when all fields are filled", async ({
  page
}) => {
  await page.getByLabel("Trip name").clear();
  await page.getByLabel("Trip name").fill("Italy 2026");

  await expect(page.getByRole("button", { name: "Update" })).toBeEnabled();
  await expect(page).toHaveScreenshot();
});

test("Dialog is closed when cancel button is clicked", async ({ page }) => {
  await page.getByRole("button", { name: "Cancel" }).click();

  await expect(page.getByText("Edit Italy")).toHaveCount(0);
  await expect(page).toHaveScreenshot();
});

test("Dialog is closed when close icon is clicked", async ({ page }) => {
  await page.getByLabel("Close modify popup").click();

  await expect(page.getByText("Edit Italy")).toHaveCount(0);
  await expect(page).toHaveScreenshot();
});
