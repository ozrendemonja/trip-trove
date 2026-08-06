import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-my-trip-mytriplist--shows-active-trip-cards"
  );

  await expect(
    page.getByRole("button", { name: "Open trip: Italy" })
  ).toBeVisible({ timeout: 5000 });
});

test("Show active trip cards with name, dates and status badge", async ({
  page
}) => {
  const italy = page.getByRole("button", { name: "Open trip: Italy" });
  await expect(italy).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Open trip: Japan Adventure" })
  ).toBeVisible();

  // Each card surfaces its date range and the Active status badge.
  await expect(italy.getByText(/2099/)).toBeVisible();
  await expect(italy.getByText("Active")).toBeVisible();

  // The active tab reflects how many trips it holds.
  await expect(page.getByRole("tab", { name: /Active \(2\)/ })).toBeVisible();

  await expect(page).toHaveScreenshot();
});
