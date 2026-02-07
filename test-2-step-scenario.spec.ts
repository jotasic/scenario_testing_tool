import { test, expect } from '@playwright/test';

test('Test 2 step scenario - node interaction issues', async ({ page }) => {
  // Collect console messages
  const consoleMessages: string[] = [];
  page.on('console', msg => {
    const text = `[${msg.type()}] ${msg.text()}`;
    consoleMessages.push(text);
    console.log(text);
  });

  // Collect errors
  const pageErrors: string[] = [];
  page.on('pageerror', error => {
    const errorText = `[PAGE ERROR] ${error.message}\n${error.stack}`;
    pageErrors.push(errorText);
    console.error(errorText);
  });

  // Step 1: Navigate to the application
  console.log('\n=== Step 1: Navigate to http://localhost:5186 ===');
  await page.goto('http://localhost:5186');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'screenshot-1-homepage.png', fullPage: true });
  console.log('Screenshot: screenshot-1-homepage.png');

  // Step 2: Find and open "2 step" scenario
  console.log('\n=== Step 2: Find and open "2 step" scenario ===');

  // Wait a bit for scenarios to load
  await page.waitForTimeout(1000);

  // Try to find the "2 step" scenario - check various possible selectors
  await page.screenshot({ path: 'screenshot-2-before-opening-scenario.png', fullPage: true });
  console.log('Screenshot: screenshot-2-before-opening-scenario.png');

  // Look for "2 step" text
  const twoStepElement = page.getByText('2 step', { exact: false });
  await twoStepElement.waitFor({ timeout: 5000 });
  await twoStepElement.click();

  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshot-3-after-opening-scenario.png', fullPage: true });
  console.log('Screenshot: screenshot-3-after-opening-scenario.png');

  // Step 3: Interact with the first node
  console.log('\n=== Step 3: Click first node (check if right panel appears) ===');

  // Find nodes in the flow canvas
  const firstNode = page.locator('.react-flow__node').first();
  await firstNode.waitFor({ timeout: 5000 });

  // Get the bounding box for dragging
  const boundingBox = await firstNode.boundingBox();
  if (!boundingBox) {
    throw new Error('Could not get node bounding box');
  }

  // Click the first node
  console.log('Clicking first node...');
  await firstNode.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshot-4-after-first-click.png', fullPage: true });
  console.log('Screenshot: screenshot-4-after-first-click.png');

  // Check if right panel appeared
  const rightPanel = page.locator('[class*="panel"], [class*="drawer"], aside, [role="complementary"]');
  const rightPanelVisible = await rightPanel.isVisible().catch(() => false);
  console.log(`Right panel visible after first click: ${rightPanelVisible}`);

  // Step 4: Drag the node slightly
  console.log('\n=== Step 4: Drag node slightly (check if warning appears) ===');

  const centerX = boundingBox.x + boundingBox.width / 2;
  const centerY = boundingBox.y + boundingBox.height / 2;

  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX + 10, centerY + 10, { steps: 5 });
  await page.mouse.up();

  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshot-5-after-drag.png', fullPage: true });
  console.log('Screenshot: screenshot-5-after-drag.png');

  // Check for warning dialog
  const dialog = page.locator('[role="dialog"], [role="alertdialog"], .MuiDialog-root');
  const dialogVisible = await dialog.isVisible().catch(() => false);
  console.log(`Warning dialog visible after drag: ${dialogVisible}`);

  if (dialogVisible) {
    const dialogText = await dialog.textContent();
    console.log(`Dialog content: ${dialogText}`);
  }

  // Step 5: Click the node again
  console.log('\n=== Step 5: Click node again (check if right panel appears) ===');

  await firstNode.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshot-6-after-second-click.png', fullPage: true });
  console.log('Screenshot: screenshot-6-after-second-click.png');

  const rightPanelVisibleSecond = await rightPanel.isVisible().catch(() => false);
  console.log(`Right panel visible after second click: ${rightPanelVisibleSecond}`);

  // Step 6: Output all console messages
  console.log('\n=== Console Messages ===');
  console.log('Total console messages:', consoleMessages.length);

  const edgeRelatedMessages = consoleMessages.filter(msg =>
    msg.toLowerCase().includes('edge') ||
    msg.toLowerCase().includes('conflict') ||
    msg.toLowerCase().includes('step')
  );

  console.log('\n=== Edge/Conflict/Step Related Messages ===');
  edgeRelatedMessages.forEach(msg => console.log(msg));

  console.log('\n=== All Console Messages ===');
  consoleMessages.forEach(msg => console.log(msg));

  console.log('\n=== Page Errors ===');
  pageErrors.forEach(err => console.log(err));

  // Wait a bit before closing
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshot-7-final.png', fullPage: true });
  console.log('Screenshot: screenshot-7-final.png');
});
