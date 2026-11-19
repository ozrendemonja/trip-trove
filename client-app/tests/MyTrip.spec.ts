import { test, expect, type Page } from "@playwright/test";

const openAddAttractions = async (page: Page): Promise<void> => {
  await page.getByRole("button", { name: "Prepare", exact: true }).click();
  await page
    .getByRole("button", { name: "Add attractions", exact: true })
    .click();
};

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2100-01-01T12:00:00Z"));
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
  await expect(page.getByRole("button", { name: "My Trips" })).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Show search button for adding attractions", async ({ page }) => {
  await expect(
    page.getByRole("button", { name: "Add attractions" })
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Prepare", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Add attractions" })
  ).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Show Edit and Plan steps in the header, not on Board", async ({
  page
}) => {
  const header = page.getByRole("region", { name: "Trip overview" });
  await expect(header.getByRole("button", { name: "Edit" })).toBeVisible();
  await expect(header.getByRole("button", { name: "Plan" })).toBeVisible();
  await expect(
    page
      .locator(".attraction-board-wrapper")
      .getByRole("button", { name: /^(Prepare|Edit|Plan|Review)$/ })
  ).toHaveCount(0);
  await expect(page).toHaveScreenshot();
});

test("Show Review step for a loaded trip", async ({ page }) => {
  await expect(page.getByRole("button", { name: /Review/i })).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Switch to Review mode and show review forms", async ({ page }) => {
  await page.getByRole("button", { name: /Review/i }).click();

  await expect(page.getByRole("button", { name: /Review/i })).toHaveAttribute(
    "aria-current",
    "step"
  );
  await expect(page).toHaveScreenshot();
});

test("Switch to Review mode using Alt+4 keyboard shortcut", async ({
  page
}) => {
  await page.keyboard.press("Alt+4");

  await expect(page.getByRole("button", { name: /Review/i })).toHaveAttribute(
    "aria-current",
    "step"
  );
});

test("Switch to Plan mode using Alt+3 keyboard shortcut on MyTrip", async ({
  page
}) => {
  await page.keyboard.press("Alt+3");

  await expect(page.getByRole("button", { name: /Plan/i })).toHaveAttribute(
    "aria-current",
    "step"
  );
});

test("Switch back to Edit mode using Alt+2 keyboard shortcut on MyTrip", async ({
  page
}) => {
  await page.keyboard.press("Alt+4");
  await page.keyboard.press("Alt+2");

  await expect(page.getByRole("button", { name: /Edit/i })).toHaveAttribute(
    "aria-current",
    "step"
  );
});

test("Cycle through all available trip steps using Ctrl+V", async ({
  page
}) => {
  await page.keyboard.press("Alt+2");

  await page.keyboard.press("Control+v");
  await expect(page.getByRole("button", { name: /Plan/i })).toHaveAttribute(
    "aria-current",
    "step"
  );

  await page.keyboard.press("Control+v");
  await expect(page.getByRole("button", { name: /Review/i })).toHaveAttribute(
    "aria-current",
    "step"
  );

  await page.keyboard.press("Control+v");
  await expect(page.getByRole("button", { name: /Prepare/i })).toHaveAttribute(
    "aria-current",
    "step"
  );
  await page.keyboard.press("Control+v");
  await expect(page.getByRole("button", { name: /Edit/i })).toHaveAttribute(
    "aria-current",
    "step"
  );
});

test("Show search modal when search button is clicked", async ({ page }) => {
  await openAddAttractions(page);

  await expect(page.getByText("Modifying Trip Planner")).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Update button is disabled when no search item is selected", async ({
  page
}) => {
  await openAddAttractions(page);

  await expect(page.getByRole("button", { name: "Update" })).toBeDisabled();
  await expect(page).toHaveScreenshot();
});

test("Show search suggestions when typing in the search field", async ({
  page
}) => {
  await openAddAttractions(page);
  await page.getByRole("textbox", { name: "Search" }).fill("Mon");

  await expect(page.getByRole("menuitem", { name: "Monaco" })).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Attractions are loaded when search item is selected and Update is clicked", async ({
  page
}) => {
  await openAddAttractions(page);
  await page.getByRole("textbox", { name: "Search" }).fill("Mon");
  await page.getByRole("menuitem", { name: "Monaco" }).click();

  await expect(page.getByRole("button", { name: "Update" })).toBeEnabled();
  await page.getByRole("button", { name: "Update" }).click();

  await expect(page.getByText("Casino of Monte-Carlo")).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Search modal is closed when close icon is clicked", async ({ page }) => {
  await openAddAttractions(page);
  await expect(page.getByText("Modifying Trip Planner")).toBeVisible();

  await page.getByLabel("Close modify popup").click();

  await expect(page.getByText("Modifying Trip Planner")).toHaveCount(0);
  await expect(page).toHaveScreenshot();
});

test("Attach attraction in Review mode after loading attractions", async ({
  page
}) => {
  await openAddAttractions(page);
  await page.getByRole("textbox", { name: "Search" }).fill("Mon");
  await page.getByRole("menuitem", { name: "Monaco" }).click();
  await page.getByRole("button", { name: "Update" }).click();

  await expect(page.getByText("Casino of Monte-Carlo")).toBeVisible();

  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Edit", exact: true })
  ).toHaveAttribute("aria-current", "step");
  await page.getByRole("button", { name: /Review/i }).click();
  await page.getByRole("button", { name: "Excellent" }).first().click();
  await page
    .getByRole("button", { name: /Add to trip/i })
    .first()
    .click();

  await expect(page.getByLabel("Remove from trip").first()).toBeVisible();
  await expect(page).toHaveScreenshot();
});

test("Detach attraction in Review mode after attaching it", async ({
  page
}) => {
  await openAddAttractions(page);
  await page.getByRole("textbox", { name: "Search" }).fill("Mon");
  await page.getByRole("menuitem", { name: "Monaco" }).click();
  await page.getByRole("button", { name: "Update" }).click();

  await expect(page.getByText("Casino of Monte-Carlo")).toBeVisible();

  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Edit", exact: true })
  ).toHaveAttribute("aria-current", "step");
  await page.getByRole("button", { name: /Review/i }).click();
  await page.getByRole("button", { name: "Excellent" }).first().click();
  await page
    .getByRole("button", { name: /Add to trip/i })
    .first()
    .click();

  await expect(page.getByLabel("Remove from trip").first()).toBeVisible();

  const attraction = page.locator(".attraction-item", {
    hasText: "Casino Square"
  });
  await attraction.getByLabel("Remove from trip").click();

  await expect(
    attraction.getByRole("button", { name: /Add to trip/i })
  ).toBeVisible();
  await expect(page).toHaveScreenshot();
});

for (const scenario of [
  {
    timezone: "UTC",
    onEndDate: "2099-06-24T12:00:00Z",
    afterEndDate: "2099-06-25T00:00:00Z"
  },
  {
    timezone: "America/Los_Angeles",
    onEndDate: "2099-06-24T20:00:00Z",
    afterEndDate: "2099-06-25T07:00:00Z"
  }
]) {
  test.describe(scenario.timezone, () => {
    test.use({ timezoneId: scenario.timezone });

    test("Review becomes available only after the trip's end date", async ({
      page
    }) => {
      await page.clock.setFixedTime(new Date(scenario.onEndDate));
      await page.reload();
      const edit = page.getByRole("button", { name: "Edit", exact: true });
      const review = page.getByRole("button", { name: "Review", exact: true });
      await edit.click();
      await expect(review).toBeDisabled();
      await expect(review).toHaveAccessibleDescription("After the trip");
      await page.keyboard.press("Alt+4");
      await expect(edit).toHaveAttribute("aria-current", "step");

      await page.clock.setFixedTime(new Date(scenario.afterEndDate));
      await page.reload();
      await expect(review).toHaveAttribute("aria-current", "step");
      await expect(review).toBeEnabled();
    });
  });
}

for (const scenario of [
  {
    width: 768,
    story: "long-trip-name",
    tripName: "An Italian journey from the coast to the mountains"
  },
  { width: 1440, story: "header-card-owns-trip-steps", tripName: "Italy" }
]) {
  test(`Trip header fits and stays in place at ${scenario.width}px`, async ({
    page
  }) => {
    await page.setViewportSize({ width: scenario.width, height: 900 });
    await page.goto(
      `http://localhost:6006/iframe.html?id=features-my-trip-mytrip--${scenario.story}`
    );
    const header = page.getByRole("region", { name: "Trip overview" });
    const name = header.getByRole("heading", { name: scenario.tripName });
    const steps = header.getByRole("navigation", { name: "Trip steps" });
    await expect(name).toBeVisible();
    await expect(steps.getByRole("button", { name: "Review" })).toHaveAttribute(
      "aria-current",
      "step"
    );
    await steps.getByRole("button", { name: "Prepare", exact: true }).click();

    const nameBounds = await name.evaluate((element) => {
      const { left, right, bottom } = element.getBoundingClientRect();
      return { left, right, bottom };
    });
    const backRight = await header
      .getByRole("button", { name: "My Trips" })
      .evaluate((element) => element.getBoundingClientRect().right);
    const searchLeft = await header
      .getByRole("button", { name: "Add attractions" })
      .evaluate((element) => element.getBoundingClientRect().left);
    const stepsTop = await steps.evaluate(
      (element) => element.getBoundingClientRect().top
    );
    expect(nameBounds.left).toBeGreaterThan(backRight);
    expect(nameBounds.right).toBeLessThan(searchLeft);
    expect(nameBounds.bottom).toBeLessThanOrEqual(stepsTop);
    const headerBottom = await header.evaluate(
      (element) => element.getBoundingClientRect().bottom
    );
    const boardTop = await page
      .locator(".attraction-board-wrapper")
      .evaluate((element) => element.getBoundingClientRect().top);
    expect(boardTop - headerBottom).toBe(12);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth
      )
    ).toBe(true);

    const headerBounds = await header.boundingBox();
    const stepPositions = await steps
      .getByRole("button")
      .evaluateAll((buttons) =>
        buttons.map((button) => {
          const { x, y } = button.getBoundingClientRect();
          return { x, y };
        })
      );
    for (const step of ["Prepare", "Edit", "Plan", "Review"]) {
      await steps.getByRole("button", { name: step, exact: true }).click();
      await expect(
        steps.getByRole("button", { name: step, exact: true })
      ).toHaveAttribute("aria-current", "step");
      expect(await header.boundingBox()).toEqual(headerBounds);
      expect(
        await steps.getByRole("button").evaluateAll((buttons) =>
          buttons.map((button) => {
            const { x, y } = button.getBoundingClientRect();
            return { x, y };
          })
        )
      ).toEqual(stepPositions);
    }
  });
}

test("Each Prepare save confirmation lasts exactly six seconds", async ({
  page
}) => {
  await openAddAttractions(page);
  const modal = page.getByRole("dialog", { name: "Modifying Trip Planner" });
  await modal.getByRole("textbox").fill("Lith");
  await modal.getByRole("menuitem", { name: "Lithuania" }).click();
  await modal.getByRole("button", { name: "Update", exact: true }).click();
  const header = page.getByRole("region", { name: "Trip overview" });
  const save = header.getByRole("button", { name: "Save to trip (1)" });
  await expect(save).toBeEnabled();

  await page.evaluate(() => {
    window.fetch = async () => new Response(null, { status: 204 });
  });
  await page.clock.install({ time: new Date("2100-01-01T12:00:00Z") });
  await page.clock.pauseAt(new Date("2100-01-01T12:00:01Z"));
  await save.click();
  await expect(
    header.getByText("1 change saved", { exact: true })
  ).toBeVisible();
  await page.clock.runFor(1000);

  const attraction = page.locator("li.attraction").filter({
    has: page.getByRole("link", { name: "Vilnius Old Town" })
  });
  const secondary = page.locator(".attraction-board-column").filter({
    has: page.getByRole("heading", { name: "Secondary Spots" })
  });
  await attraction.dragTo(secondary);
  await expect(save).toBeEnabled();
  await save.click();
  const confirmation = header.getByText("1 change saved", { exact: true });
  await expect(confirmation).toBeVisible();
  await page.clock.runFor(5999);
  await expect(confirmation).toBeVisible();
  await page.clock.runFor(1);
  await expect(confirmation).toHaveCount(0);
  await expect(
    header.getByText("All changes saved", { exact: true })
  ).toBeVisible();
});

test("Trip header stays put when a step adds the vertical scrollbar", async ({
  page
}) => {
  await page.setViewportSize({ width: 1440, height: 600 });
  await page.goto(
    "http://localhost:6006/iframe.html?id=features-my-trip-mytrip--header-card-owns-trip-steps"
  );
  const header = page.getByRole("region", { name: "Trip overview" });
  const edit = header.getByRole("button", { name: "Edit", exact: true });
  const review = header.getByRole("button", { name: "Review", exact: true });
  await edit.click();
  await expect(edit).toHaveAttribute("aria-current", "step");
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollHeight >
        document.documentElement.clientHeight
    )
  ).toBe(false);
  const before = await header.boundingBox();

  await review.click();
  await expect(
    page.getByRole("button", { name: "Excellent", exact: true })
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollHeight >
        document.documentElement.clientHeight
    )
  ).toBe(true);
  await expect(page.locator("html")).toHaveCSS("scrollbar-gutter", "stable");
  expect(await header.boundingBox()).toEqual(before);

  await edit.click();
  await expect(edit).toHaveAttribute("aria-current", "step");
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollHeight >
        document.documentElement.clientHeight
    )
  ).toBe(false);
  expect(await header.boundingBox()).toEqual(before);
});
