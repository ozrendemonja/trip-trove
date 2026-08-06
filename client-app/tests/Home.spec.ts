import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-home--primary"
  );

  await page.getByRole("button").first().waitFor();
});

test("Expend dashboard list when click on the text", async ({ page }) => {
  await page.getByRole("button", { name: "Dashboard" }).click();

  await expect(page).toHaveScreenshot();
});

test("Should show list of suggested continents when search for continents", async ({
  page
}) => {
  await page.getByRole("textbox", { name: "Search" }).fill("Abc");

  await expect(page.getByRole("menuitem", { name: "Europe" })).toHaveCount(1);

  await expect(page).toHaveScreenshot();
});

test("Should show selected continent when click on one of sugested continents", async ({
  page
}) => {
  await page.getByRole("textbox", { name: "Search" }).fill("Abc");

  await page.getByRole("menuitem", { name: "Europe" }).click();
  await expect(page.getByRole("menuitem", { name: "Europe" })).toHaveCount(0);

  await expect(page).toHaveScreenshot();
});