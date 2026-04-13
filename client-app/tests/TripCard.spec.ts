import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-my-trip-tripcard--active"
  );

  await expect(page.getByText("Italy")).toBeVisible();
});

test("Show active trip card with edit and delete buttons", async ({
  page
}) => {
  await expect(page.getByLabel("Edit trip")).toBeVisible();
  await expect(page.getByLabel("Delete trip")).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Show past trip card", async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-my-trip-tripcard--past"
  );

  await expect(page.getByText("Japan 2025")).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Show archived trip card", async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-my-trip-tripcard--archived"
  );

  await expect(page.getByText("Old Road Trip")).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Show trip card without dates", async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-my-trip-tripcard--no-dates"
  );

  await expect(page.getByText("New Adventure")).toBeVisible();
  await expect(page.getByText("Dates not set")).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Show trip card with long name", async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-my-trip-tripcard--long-name"
  );

  await expect(
    page.getByText("South East Asia — Thailand, Vietnam & Cambodia")
  ).toBeVisible();
  await expect(page).toHaveScreenshot();
});
