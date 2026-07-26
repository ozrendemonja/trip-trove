const { getStoryContext } = require("@storybook/test-runner");

/*
 * The attraction list renders its DetailsList with
 * ConstrainMode.horizontalConstrained, which drops the trailing columns
 * (traditional, info, visit period, tip) when the viewport is too narrow.
 * Stories tagged "wide" opt into a large viewport so every column mounts and
 * its edit dialog can be exercised by the play function.
 */
module.exports = {
  async preVisit(page, context) {
    const storyContext = await getStoryContext(page, context);
    if (storyContext.tags?.includes("wide")) {
      await page.setViewportSize({ width: 2560, height: 1200 });
    }
  }
};
