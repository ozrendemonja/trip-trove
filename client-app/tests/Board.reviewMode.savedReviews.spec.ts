import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-ai-table-components-board--review-mode-with-saved-reviews"
  );

  await expect(page.getByText("Eiffel Tower")).toBeVisible();
});

test("Pre-loaded review shows rating and review note for reviewed attraction", async ({
  page
}) => {
  await expect(page.getByText("🤩 Excellent").first()).toBeVisible();
  await expect(page.getByText("Stunning sunset views")).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Pre-loaded review without review note shows only rating", async ({
  page
}) => {
  const montmartre = page.locator(".attraction-item", {
    hasText: "Montmartre"
  });
  await expect(montmartre.getByText("😊 Very Good")).toBeVisible();
  await expect(montmartre.getByText("Stunning sunset views")).not.toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Attraction note remains visible alongside review data", async ({
  page
}) => {
  await expect(page.getByText("Book summit tickets in advance")).toBeVisible();
  await expect(page.getByText("🤩 Excellent").first()).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Clearing review removes review note but keeps attraction note", async ({
  page
}) => {
  const eiffelTower = page.locator(".attraction-item", {
    hasText: "Eiffel Tower"
  });
  await expect(eiffelTower.getByText("Stunning sunset views")).toBeVisible();

  await eiffelTower.getByLabel("Remove from trip").click();

  await expect(
    eiffelTower.getByText("Stunning sunset views")
  ).not.toBeVisible();
  await expect(
    eiffelTower.getByText("Book summit tickets in advance")
  ).toBeVisible();
  await expect(
    eiffelTower.getByRole("button", { name: /Add to trip/i })
  ).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Review note is submitted when attaching attraction with note", async ({
  page
}) => {
  const louvre = page.locator(".attraction-item", { hasText: "Louvre Museum" });
  await louvre.getByRole("button", { name: "Very Good" }).click();
  await louvre
    .getByPlaceholder("Trip note (optional, max 512 chars)")
    .fill("Must see Mona Lisa");
  await louvre.getByRole("button", { name: /Add to trip/i }).click();

  await expect(louvre.getByText("😊 Very Good")).toBeVisible();
  await expect(louvre.getByText("Must see Mona Lisa")).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Attaching without review note shows only rating", async ({ page }) => {
  const notreDame = page.locator(".attraction-item", {
    hasText: "Notre-Dame"
  });
  await notreDame.getByRole("button", { name: "Excellent" }).click();
  await notreDame.getByRole("button", { name: /Add to trip/i }).click();

  await expect(notreDame.getByText("🤩 Excellent")).toBeVisible();
  await expect(
    notreDame.getByRole("button", { name: /Add to trip/i })
  ).not.toBeVisible();
  await expect(page).toHaveScreenshot();
});
