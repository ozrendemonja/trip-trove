import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-my-trip-mytrip--primary"
  );

  await expect(page.getByText("Italy")).toBeVisible();
});

test("Show trip name loaded from API", async ({ page }) => {
  await expect(page.getByText("Italy")).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Show back button to navigate to My Trips", async ({ page }) => {
  await expect(
    page.getByRole("button", { name: "My Trips" })
  ).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Show search button for adding attractions", async ({ page }) => {
  await expect(page.getByLabel("Search")).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Show Edit and Plan mode buttons on Board", async ({ page }) => {
  await expect(page.getByRole("button", { name: /Edit/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Plan/i })).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Show Review mode button because tripId is passed to Board", async ({
  page
}) => {
  await expect(
    page.getByRole("button", { name: /Review/i })
  ).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Switch to Review mode and show review forms", async ({ page }) => {
  await page.getByRole("button", { name: /Review/i }).click();

  await expect(page.getByRole("button", { name: /Review/i })).toHaveClass(
    /mode-btn-active/
  );
  await expect(page).toHaveScreenshot();
});

test("Show search modal when search button is clicked", async ({ page }) => {
  await page.getByLabel("Search").click();

  await expect(page.getByText("Modifying Trip Planner")).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Update button is disabled when no search item is selected", async ({
  page
}) => {
  await page.getByLabel("Search").click();

  await expect(page.getByRole("button", { name: "Update" })).toBeDisabled();
  await expect(page).toHaveScreenshot();
});

test("Show search suggestions when typing in the search field", async ({
  page
}) => {
  await page.getByLabel("Search").click();
  await page.getByRole("textbox", { name: "Search" }).fill("Mon");

  await expect(page.getByRole("menuitem", { name: "Monaco" })).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Attractions are loaded when search item is selected and Update is clicked", async ({
  page
}) => {
  await page.getByLabel("Search").click();
  await page.getByRole("textbox", { name: "Search" }).fill("Mon");
  await page.getByRole("menuitem", { name: "Monaco" }).click();

  await expect(page.getByRole("button", { name: "Update" })).toBeEnabled();
  await page.getByRole("button", { name: "Update" }).click();

  await expect(page.getByText("Casino of Monte-Carlo")).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Search modal is closed when close icon is clicked", async ({ page }) => {
  await page.getByLabel("Search").click();
  await expect(page.getByText("Modifying Trip Planner")).toBeVisible();

  await page.getByLabel("Close modify popup").click();

  await expect(page.getByText("Modifying Trip Planner")).toHaveCount(0);
  await expect(page).toHaveScreenshot();
});

test("Attach attraction in Review mode after loading attractions", async ({
  page
}) => {
  await page.getByLabel("Search").click();
  await page.getByRole("textbox", { name: "Search" }).fill("Mon");
  await page.getByRole("menuitem", { name: "Monaco" }).click();
  await page.getByRole("button", { name: "Update" }).click();

  await expect(page.getByText("Casino of Monte-Carlo")).toBeVisible();

  await page.getByRole("button", { name: /Review/i }).click();
  await page.getByRole("button", { name: "Excellent" }).first().click();
  await page.getByRole("button", { name: /Add to trip/i }).first().click();

  await expect(page.getByLabel("Remove from trip").first()).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Detach attraction in Review mode after attaching it", async ({
  page
}) => {
  await page.getByLabel("Search").click();
  await page.getByRole("textbox", { name: "Search" }).fill("Mon");
  await page.getByRole("menuitem", { name: "Monaco" }).click();
  await page.getByRole("button", { name: "Update" }).click();

  await expect(page.getByText("Casino of Monte-Carlo")).toBeVisible();

  await page.getByRole("button", { name: /Review/i }).click();
  await page.getByRole("button", { name: "Excellent" }).first().click();
  await page.getByRole("button", { name: /Add to trip/i }).first().click();

  await expect(page.getByLabel("Remove from trip").first()).toBeVisible();

  await page.getByLabel("Remove from trip").first().click();

  await expect(
    page.getByRole("button", { name: /Add to trip/i }).first()
  ).toBeVisible();
  await expect(page).toHaveScreenshot();
});