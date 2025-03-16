import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 2560, height: 1920 });

  await page.goto(
    "http://localhost:6006/iframe.html?id=features-continent-pages-list-attraction-listattraction--primary"
  );

  await page.waitForSelector('div[data-automationid="DetailsList"]');
  await expect(
    page.getByRole("gridcell", { name: /Vilnius Old Town$/ }).nth(0)
  ).toBeVisible();
});

test("Display the edit attraction traditional dialog when the edit button in the type column is clicked", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction traditional preferences for Vilnius Old Town to non traditional"
    })
    .click();

  await expect(page).toHaveScreenshot();
});

test("List is shown unchanged when update attraction traditional is closed without action", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction traditional preferences for Vilnius Old Town to non traditional"
    })
    .click();
  await page.getByRole("button", { name: "Cancel" }).click();

  await expect(page.getByText("Modifying")).toHaveCount(0);
  await expect(
    page.getByRole("button", {
      name: "Change attraction traditional preferences for Vilnius Old Town to non traditional"
    })
  ).toHaveCount(1);
  await expect(page.getByText("Casino of Monte-Carlo")).toHaveCount(1);
  await expect(page.getByText("Casino of Monte-Carlo")).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("List should contain updated values when new attraction traditional dialog closes", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction traditional preferences for Vilnius Old Town to non traditional"
    })
    .click();
  await page.getByRole("button", { name: "Update" }).click();

  await expect(page.getByText("Modifying")).toHaveCount(0);
  await expect(
    page.getByRole("button", {
      name: "Change attraction traditional preferences for Vilnius Old Town to non traditional"
    })
  ).toHaveCount(0);
  await expect(page.getByText("Casino of Monte-Carlo")).toHaveCount(1);
  await expect(page.getByText("Casino of Monte-Carlo")).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Display the edit attraction info dialog when the edit button in the info column is clicked", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction info from Google reviews"
    })
    .click();

  await expect(page).toHaveScreenshot();
});

test("List is shown unchanged when update attraction info is closed without action", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction info from Google reviews"
    })
    .click();
  await page.getByRole("button", { name: "Cancel" }).click();

  await expect(page.getByText("Casino of Monte-Carlo")).toHaveCount(1);
  await expect(page.getByText("Casino of Monte-Carlo")).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Update button on the edit attraction info dialog is disabled and error message is shown when added info from is empty", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction info from Google reviews"
    })
    .click();
  await page.getByLabel("Where information comes from").fill("A");
  await page.getByLabel("Where information comes from").fill("");
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot();
});

test("Update button on the edit attraction info dialog is disabled and error message is shown when added info from is invalid", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction info from Google reviews"
    })
    .click();
  await page
    .getByLabel("Where information comes from")
    .fill("A".repeat(512) + "B");
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot();
});

test("Update button on the edit attraction info dialog is disabled when no recorded date is choosen", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction info from Google reviews"
    })
    .click();
  await page.getByLabel("Where information comes from").fill("Test record");
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot();
});

test("List should contain updated values when new attraction info dialog closes", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction info from Google reviews"
    })
    .click();
  await page.getByLabel("Where information comes from").fill("Test record");
  await page
    .getByRole("combobox", { name: "Date of information recording" })
    .fill("Mon Feb 17 2025");
  await page.getByRole("button", { name: "Cancel" }).focus();
  await page.getByRole("button", { name: "Update" }).click();

  await expect(page.getByText("Modifying")).toHaveCount(0);
  await expect(page.getByText("Test record")).toHaveCount(1);
  await expect(page.getByText("Casino of Monte-Carlo")).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Display the edit attraction visit period dialog when the edit button in the visit period column is clicked", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction visit period for Larvotto Beach"
    })
    .click();

  await expect(page).toHaveScreenshot();
});

test("List is shown unchanged when new attraction visit period closes", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction visit period for Larvotto Beach"
    })
    .click();
  await page.getByRole("button", { name: "Close" }).click();

  await expect(page.getByText("Modifying")).toHaveCount(0);
  await expect(page.getByText("Casino of Monte-Carlo")).toHaveCount(1);
  await expect(page.getByText("Casino of Monte-Carlo")).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("List should contain updated values when new attraction visit period dialog closes", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction visit period for Larvotto Beach"
    })
    .click();
  await page.getByRole("button", { name: "Update" }).click();

  await expect(page.getByText("Modifying")).toHaveCount(0);
  await expect(page.getByText("1 Apr")).toHaveCount(0);
  await expect(page.getByText("Casino of Monte-Carlo")).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Display the edit attraction tip dialog when the edit button in the tip column is clicked", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction tip for Casino Square"
    })
    .click();

  await expect(page).toHaveScreenshot();
});

test("List is shown unchanged when new attraction tip closes", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction tip for Casino Square"
    })
    .click();
  await page.getByLabel(/Tip$/).fill("Test test test");
  await page.getByRole("button", { name: "Close" }).click();

  await expect(page.getByText("Modifying")).toHaveCount(0);
  await expect(page.getByText("Casino of Monte-Carlo")).toHaveCount(1);
  await expect(page.getByText("Casino of Monte-Carlo")).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Update button on the edit attraction tip dialog is disabled and error message is shown when added tip is invalid", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction tip for Casino Square"
    })
    .click();
  await page.getByLabel(/Tip$/).fill("A".repeat(2049));
  await page.getByRole("button", { name: "Cancel" }).focus();

  await expect(page).toHaveScreenshot();
});

test("All buttons on the the update attraction tip dialog are disabled when the update is taking place", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction tip for Casino Square"
    })
    .click();
  await page.getByLabel(/Tip$/).fill("Test test test");
  await page.getByRole("button", { name: "Update" }).click();

  await expect(page).toHaveScreenshot();
});

test("List should contain updated values when new attraction tip dialog closes", async ({
  page
}) => {
  await page
    .getByRole("button", {
      name: "Change attraction tip for Casino Square"
    })
    .click();
  await page.getByLabel(/Tip$/).fill("Test test test");
  await page.getByRole("button", { name: "Update" }).click();

  await expect(page.getByText("Modifying")).toHaveCount(0);
  await expect(page.getByText("Test test test")).toHaveCount(1);
  await expect(page.getByText("Casino of Monte-Carlo")).toBeVisible();
  await expect(page).toHaveScreenshot();
});
