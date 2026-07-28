const { getStoryContext } = require("@storybook/test-runner");

/*
 * Attraction-list stories are tagged "wide" so their DetailsList renders every
 * column fully on-screen while the play function exercises the trailing
 * columns' edit dialogs (traditional, info, visit period, tip). The list now
 * keeps ALL columns mounted at any width (ConstrainMode.unconstrained +
 * non-collapsible columns => horizontal scroll instead of dropped columns), so
 * the wide viewport is no longer required for columns to exist — it just keeps
 * every cell in view so interactions don't have to scroll horizontally.
 */
module.exports = {
  async preVisit(page, context) {
    const storyContext = await getStoryContext(page, context);
    if (storyContext.tags?.includes("wide")) {
      await page.setViewportSize({ width: 2560, height: 1200 });
    }
  }
};
