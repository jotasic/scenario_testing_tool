import { test, expect } from '@playwright/test';

test('Debug right panel visibility issue in nested containers', async ({ page }) => {
  // Collect console messages
  const consoleMessages: string[] = [];
  page.on('console', msg => {
    const text = `[${msg.type()}] ${msg.text()}`;
    consoleMessages.push(text);
    console.log(text);
  });

  // Navigate to the application
  console.log('\n=== Step 1: Navigate to application ===');
  await page.goto('http://localhost:5186');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'debug-1-homepage.png', fullPage: true });
  console.log('Screenshot: debug-1-homepage.png');

  // Find the Loop container "Process Each Item"
  console.log('\n=== Step 2: Find Loop container "Process Each Item" ===');
  const loopContainer = page.getByText('Process Each Item', { exact: false });
  const loopExists = await loopContainer.isVisible().catch(() => false);
  console.log(`Loop container "Process Each Item" visible: ${loopExists}`);

  if (!loopExists) {
    console.log('Loop container not found - scenario might not be loaded yet');
    await page.screenshot({ path: 'debug-2-no-loop.png', fullPage: true });
    return;
  }

  // Click on a root-level node first
  console.log('\n=== Step 3: Click root-level node "Get User" ===');
  const getUserStep = page.getByText('Get User').first();
  await getUserStep.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'debug-3-root-node-clicked.png', fullPage: true });
  console.log('Screenshot: debug-3-root-node-clicked.png');

  // Check if right panel is visible
  let rightPanel = page.locator('[data-testid*="detail"], [class*="detail"], [class*="StepDetail"]').first();
  let rightPanelVisible = await page.evaluate(() => {
    // Look for any element that looks like a detail panel
    const panels = document.querySelectorAll('div');
    for (const panel of Array.from(panels)) {
      const text = panel.textContent || '';
      if (text.includes('Step Details') || text.includes('Description') || text.includes('Execution Mode')) {
        return true;
      }
    }
    return false;
  });
  console.log(`Right panel visible at root level: ${rightPanelVisible}`);

  // Double-click the loop container to navigate inside
  console.log('\n=== Step 4: Double-click Loop container to navigate inside ===');
  const loopNode = page.locator('.react-flow__node').filter({ hasText: 'Process Each Item' }).first();
  await loopNode.dblclick();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'debug-4-inside-loop.png', fullPage: true });
  console.log('Screenshot: debug-4-inside-loop.png');

  // Check breadcrumbs
  const breadcrumbsVisible = await page.getByText('Process Each Item').first().isVisible().catch(() => false);
  console.log(`Breadcrumbs showing "Process Each Item": ${breadcrumbsVisible}`);

  // Click a node inside the loop container
  console.log('\n=== Step 5: Click node inside loop container ===');
  const innerNode = page.locator('.react-flow__node').first();
  await innerNode.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'debug-5-inner-node-clicked.png', fullPage: true });
  console.log('Screenshot: debug-5-inner-node-clicked.png');

  // Check if right panel is visible now
  rightPanelVisible = await page.evaluate(() => {
    const panels = document.querySelectorAll('div');
    for (const panel of Array.from(panels)) {
      const text = panel.textContent || '';
      if (text.includes('Step Details') || text.includes('Description') || text.includes('Execution Mode')) {
        return true;
      }
    }
    return false;
  });
  console.log(`Right panel visible inside container: ${rightPanelVisible}`);

  // Navigate back to root
  console.log('\n=== Step 6: Navigate back to root ===');
  const rootBreadcrumb = page.getByText('Root', { exact: false }).first();
  const rootExists = await rootBreadcrumb.isVisible().catch(() => false);
  if (rootExists) {
    await rootBreadcrumb.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'debug-6-back-to-root.png', fullPage: true });
    console.log('Screenshot: debug-6-back-to-root.png');
  }

  // Click root node again
  console.log('\n=== Step 7: Click root node again ===');
  await getUserStep.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'debug-7-root-node-clicked-again.png', fullPage: true });
  console.log('Screenshot: debug-7-root-node-clicked-again.png');

  rightPanelVisible = await page.evaluate(() => {
    const panels = document.querySelectorAll('div');
    for (const panel of Array.from(panels)) {
      const text = panel.textContent || '';
      if (text.includes('Step Details') || text.includes('Description') || text.includes('Execution Mode')) {
        return true;
      }
    }
    return false;
  });
  console.log(`Right panel visible at root level again: ${rightPanelVisible}`);

  console.log('\n=== Console Messages ===');
  consoleMessages.forEach(msg => console.log(msg));
});
