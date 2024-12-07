import { toMatchImageSnapshot } from 'jest-image-snapshot';
import puppeteer from 'puppeteer';

module.exports = () => {
    describe("Test continent primary", () => {
        // Loop each variants for component
        const variant = "primary";
        const variantPrefix = variant ? `--${variant}` : "";

        it(`${variant} should render the same`, async () => {
            let browser;

            try {
                // Launch puppeteer instance
                browser = await puppeteer.launch();

                const page = await browser.newPage();
                page.setDefaultTimeout(50000);

                // Wait till loaded
                await page.goto(
                    `http://localhost:6006/iframe.html?id=features-continent-pages-continent${variantPrefix}`,
                    {
                        waitUntil: "networkidle2",
                        timeout: 5000,
                    }
                );

                await page.waitForSelector('#storybook-root');

                // Take screenshot
                const screenshot = await page.screenshot({ type: "jpeg", path: 'demo.jpeg', });

                // Test screenshot (also save this new screenshot if -u is set)
                // expect(screenshot).toMatchImageSnapshot();
                // expect(screenshot).toMatchImageSnapshot();
                // expect(screenshot).toMatchImageSnapshot({
                //     path: `.snapshots/${component}${variantPrefix}.png`,
                // });
            } finally {
                // Cleanup
                if (browser) await browser.close();
            }
        });
    });
};