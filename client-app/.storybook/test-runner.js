const { getStoryContext } = require("@storybook/test-runner");

/*
 * Attraction-list stories are tagged "wide" so their DetailsList renders every
 * column fully on-screen while the play function exercises the trailing
 * columns' edit dialogs (traditional, info, visit period, tip).
 */
module.exports = {
  async preVisit(page, context) {
    const storyContext = await getStoryContext(page, context);
    if (storyContext.tags?.includes("wide")) {
      await page.setViewportSize({ width: 2560, height: 1200 });
    }
  }
};
