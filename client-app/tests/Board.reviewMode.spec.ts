import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-ai-table-components-board--review-mode"
  );

  await expect(page.getByText("Eiffel Tower")).toBeVisible();
});

test("Show board in Review mode with Review button active", async ({
  page
}) => {
  await expect(page.getByRole("button", { name: /Review/i })).toHaveClass(
    /mode-btn-active/
  );
  await expect(page).toHaveScreenshot();
});

test("Review button is visible when tripId is provided", async ({ page }) => {
  await expect(page.getByRole("button", { name: /Review/i })).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Show review form with rating buttons and note input for each attraction", async ({
  page
}) => {
  await expect(page.getByRole("button", { name: "Disliked" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Below Average" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Average" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Very Good" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Excellent" }).first()).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Show Add to trip button in review form", async ({ page }) => {
  await expect(
    page.getByRole("button", { name: /Add to trip/i }).first()
  ).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Select a rating in review form", async ({ page }) => {
  await page.getByRole("button", { name: "Excellent" }).first().click();

  await expect(
    page.getByRole("button", { name: "Excellent" }).first()
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page).toHaveScreenshot();
});

test("Attach attraction to trip when Add to trip is clicked", async ({
  page
}) => {
  await page.getByRole("button", { name: "Excellent" }).first().click();
  await page.getByRole("button", { name: /Add to trip/i }).first().click();

  await expect(page.getByText("Excellent").first()).toBeVisible();
  await expect(
    page.getByLabel("Remove from trip").first()
  ).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Attach attraction with a note", async ({ page }) => {
  await page.getByRole("button", { name: "Very Good" }).first().click();
  await page
    .getByPlaceholder("Trip note (optional, max 512 chars)")
    .first()
    .fill("Amazing view from the top");
  await page.getByRole("button", { name: /Add to trip/i }).first().click();

  await expect(page.getByText("Very Good").first()).toBeVisible();
  await expect(page.getByText("Amazing view from the top")).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Detach attraction from trip when Remove button is clicked", async ({
  page
}) => {
  await page.getByRole("button", { name: "Excellent" }).first().click();
  await page.getByRole("button", { name: /Add to trip/i }).first().click();

  await expect(page.getByLabel("Remove from trip").first()).toBeVisible();

  await page.getByLabel("Remove from trip").first().click();

  await expect(
    page.getByRole("button", { name: /Add to trip/i }).first()
  ).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Record every rating emoji when attaching attractions", async ({
  page
}) => {
  const ratings = [
    { attraction: "Eiffel Tower", rating: "Disliked", badge: "😞 Disliked" },
    {
      attraction: "Louvre Museum",
      rating: "Below Average",
      badge: "😕 Below Average"
    },
    { attraction: "Tower of London", rating: "Average", badge: "😐 Average" },
    {
      attraction: "Borough Market",
      rating: "Very Good",
      badge: "😊 Very Good"
    },
    {
      attraction: "Seine River Cruise",
      rating: "Excellent",
      badge: "🤩 Excellent"
    }
  ];

  for (const { attraction, rating } of ratings) {
    const item = page.locator(".attraction-item", { hasText: attraction });
    await item.getByRole("button", { name: rating, exact: true }).click();
    await item.getByRole("button", { name: /Add to trip/i }).click();
  }

  for (const { attraction, badge } of ratings) {
    await expect(
      page.locator(".attraction-item", { hasText: attraction }).getByText(badge)
    ).toBeVisible();
  }

  await expect(page).toHaveScreenshot({ fullPage: true });
});
