import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-home--primary"
  );

  await page.getByRole("button").first().waitFor();
});

for (const width of [1280, 1024]) {
  for (const story of [
    "features-home--primary",
    "features-my-trip-mytriplist--with-trips",
    "features-bucket-list-bucketlist--primary",
    "features-continent-pages-list-continent-listcontinent--primary",
    "features-continent-pages-list-attraction-listattraction--primary",
    "features-continent-pages-list-attraction-user-listattractionuser--primary"
  ]) {
    test(`Keeps the same navigation dimensions for ${story} at ${width}px`, async ({
      page
    }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(`http://localhost:6006/iframe.html?id=${story}`);

      const navigation = page.getByRole("navigation", {
        name: "Navigation menu"
      });
      await navigation.waitFor();

      const sidebar = navigation.locator("..");
      const dashboard = navigation.getByRole("button", { name: "Dashboard" });

      await expect(sidebar).toHaveCSS("width", "200px");
      await expect(sidebar).toHaveCSS("height", "792px");
      await expect(sidebar).toHaveCSS("margin-right", "16px");
      expect(await sidebar.boundingBox()).toMatchObject({ x: 4, y: 4 });
      await expect(dashboard).toHaveCSS("min-height", "40px");
      await expect(dashboard).toHaveCSS("font-size", "14px");

      await dashboard.click();

      await expect(
        navigation.getByRole("link", { name: "Attractions", exact: true })
      ).toBeVisible();
      await expect(sidebar).toHaveCSS("width", "200px");
      await expect(sidebar).toHaveCSS("height", "792px");
    });
  }
}

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