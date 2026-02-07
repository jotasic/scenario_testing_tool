import { test, expect } from '@playwright/test';

test('Explore the page structure', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);

  // Take initial screenshot
  await page.screenshot({ path: 'screenshots/01-initial-page.png', fullPage: true });

  // Get page title
  const title = await page.title();
  console.log('Page title:', title);

  // Get all text content
  const bodyText = await page.locator('body').textContent();
  console.log('Page text (first 500 chars):', bodyText?.slice(0, 500));

  // Find all buttons and links
  const buttons = await page.locator('button').all();
  console.log(`Found ${buttons.length} buttons`);

  const links = await page.locator('a').all();
  console.log(`Found ${links.length} links`);

  // Try to find scenario-related elements
  const scenarios = await page.locator('[class*="scenario"], [class*="Scenario"]').all();
  console.log(`Found ${scenarios.length} scenario elements`);

  // List all clickable elements with text
  const clickableElements = await page.locator('button, a, [role="button"]').all();
  for (let i = 0; i < Math.min(clickableElements.length, 20); i++) {
    const text = await clickableElements[i].textContent();
    console.log(`Clickable ${i}: ${text?.trim().slice(0, 50)}`);
  }
});
