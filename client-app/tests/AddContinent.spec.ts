import { test, expect } from '@playwright/test';

test('Save button is disabled when continent name is empty', async ({ page }) => {
    await page.goto('http://localhost:6006/iframe.html?id=features-continent-pages-addcontinent--primary');

    await page.getByRole("heading", { name: "Add Continent" });
    await expect(page).toHaveScreenshot();
});

test('Save button is enabled when continent name is valid', async ({ page }) => {
    await page.goto('http://localhost:6006/iframe.html?id=features-continent-pages-addcontinent--primary');
    await page.getByRole("heading", { name: "Add Continent" });

    await page.getByLabel("Continent name").fill("Asia");
    await page.getByRole("button", { name: "Cancel" }).focus();

    await expect(page).toHaveScreenshot();
});

test('Save button is disabled and error message is shown when continent name is too short', async ({ page }) => {
    await page.goto('http://localhost:6006/iframe.html?id=features-continent-pages-addcontinent--primary');
    await page.getByRole("heading", { name: "Add Continent" });

    await page.getByLabel("Continent name").fill("Asia");
    await page.getByLabel("Continent name").fill("");
    await page.getByRole("button", { name: "Cancel" }).focus();

    await expect(page).toHaveScreenshot();
});

test('Save button is disabled and error message is shown when continent name is too long', async ({ page }) => {
    await page.goto('http://localhost:6006/iframe.html?id=features-continent-pages-addcontinent--primary');
    await page.getByRole("heading", { name: "Add Continent" });

    await page.getByLabel("Continent name").fill("A".repeat(65));
    await page.getByRole("button", { name: "Cancel" }).focus();

    await expect(page).toHaveScreenshot();
});
