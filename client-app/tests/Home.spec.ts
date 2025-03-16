import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-home--primary"
  );

  await page.waitForSelector(".ms-Button");
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

test("Should show list of suggested countries when search for country", async ({
  page
}) => {
  await page.getByText("Country").click();
  await page.getByRole("textbox", { name: "Search" }).fill("Mon");

  await expect(page.getByRole("menuitem", { name: "Monaco" })).toHaveCount(1);

  await expect(page).toHaveScreenshot();
});

test("Should show selected country when click on one of sugested countries", async ({
  page
}) => {
  await page.getByText("Country").click();
  await page.getByRole("textbox", { name: "Search" }).fill("Mon");

  await page.getByRole("menuitem", { name: "Monaco" }).click();
  await expect(page.getByRole("menuitem", { name: "Monaco" })).toHaveCount(0);

  await expect(page).toHaveScreenshot();
});

test("Should show list of suggested regions when search for region", async ({
  page
}) => {
  await page.getByText("Region").click();
  await page.getByRole("textbox", { name: "Search" }).fill("Mon");

  await expect(page.getByRole("menuitem", { name: "Monaco" })).toHaveCount(1);

  await expect(page).toHaveScreenshot();
});

test("Should show selected region when click on one of sugested regions", async ({
  page
}) => {
  await page.getByText("Region").click();
  await page.getByRole("textbox", { name: "Search" }).fill("Mon");

  await page.getByRole("menuitem", { name: "Monaco" }).click();
  await expect(page.getByRole("menuitem", { name: "Monaco" })).toHaveCount(0);

  await expect(page).toHaveScreenshot();
});

test("Should show list of suggested cities when search for city", async ({
  page
}) => {
  await page.getByText("City").click();
  await page.getByRole("textbox", { name: "Search" }).fill("Mon");

  await expect(
    page.getByRole("menuitem", { name: "Monaco, Monaco, Monaco" })
  ).toHaveCount(1);

  await expect(page).toHaveScreenshot();
});

test("Should show selected city when click on one of sugested cities", async ({
  page
}) => {
  await page.getByText("City").click();
  await page.getByRole("textbox", { name: "Search" }).fill("Mon");

  await page.getByRole("menuitem", { name: "Monaco, Monaco, Monaco" }).click();
  await expect(
    page.getByRole("menuitem", { name: "Monaco, Monaco, Monaco" })
  ).toHaveCount(0);

  await expect(page).toHaveScreenshot();
});

test("Should show list of suggested main attractions when search for main attraction", async ({
  page
}) => {
  await page.getByText("Main attraction").click();
  await page.getByRole("textbox", { name: "Search" }).fill("Cas");

  await expect(
    page.getByRole("menuitem", { name: "Casino Square" })
  ).toHaveCount(1);

  await expect(page).toHaveScreenshot();
});

test("Should show selected attraction when click on one of sugested main attractions", async ({
  page
}) => {
  await page.getByText("Main attraction").click();
  await page.getByRole("textbox", { name: "Search" }).fill("Cas");

  await page.getByRole("menuitem", { name: "Casino Square" }).click();
  await expect(
    page.getByRole("menuitem", { name: "Casino Square" })
  ).toHaveCount(0);

  await expect(page).toHaveScreenshot();
});
