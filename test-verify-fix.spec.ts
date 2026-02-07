import { test, expect } from '@playwright/test';

test('Verify fix: Right panel now appears inside containers', async ({ page }) => {
  // Navigate to the application
  console.log('\n=== Test: Verify right panel appears inside containers ===\n');
  await page.goto('http://localhost:5186');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  console.log('Step 1: Navigate into Loop container');
  const loopNode = page.locator('.react-flow__node').filter({ hasText: 'Process Each Item' }).first();
  await loopNode.dblclick();
  await page.waitForTimeout(1500);

  // Verify we're inside the container
  const breadcrumb = await page.locator('nav, [class*="breadcrumb"]').textContent().catch(() => '');
  console.log(`Breadcrumbs: ${breadcrumb}`);
  expect(breadcrumb).toContain('Process Each Item');

  console.log('\nStep 2: Click a node inside the container');
  const innerNode = page.locator('.react-flow__node').first();
  await innerNode.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'verify-fix-inside-container.png', fullPage: true });

  console.log('\nStep 3: Check if right panel is visible');

  // Method 1: Look for ResizableDetailPanel
  const detailPanel = page.locator('[class*="ResizableDetailPanel"], [class*="StepDetailPanel"]').first();
  const detailPanelExists = await detailPanel.isVisible().catch(() => false);

  // Method 2: Look for characteristic content
  const hasStepDetails = await page.evaluate(() => {
    const allText = document.body.textContent || '';
    return allText.includes('Step Details') ||
           allText.includes('Execution Mode') ||
           (allText.includes('Description') && allText.includes('Server'));
  });

  // Method 3: Check for the close button that should be in StepDetailPanel
  const closeButton = page.getByRole('button', { name: /close/i }).first();
  const closeButtonVisible = await closeButton.isVisible().catch(() => false);

  console.log(`Detail panel element visible: ${detailPanelExists}`);
  console.log(`Has step details content: ${hasStepDetails}`);
  console.log(`Close button visible: ${closeButtonVisible}`);

  const panelVisible = detailPanelExists || hasStepDetails || closeButtonVisible;

  if (panelVisible) {
    console.log('\n✅ SUCCESS: Right panel IS visible inside container!');
    console.log('The fix is working correctly.');
  } else {
    console.log('\n❌ FAILED: Right panel is still NOT visible inside container');
    console.log('The fix may not have been applied correctly.');
  }

  // Additional verification: Count the number of panels
  const panelCount = await page.evaluate(() => {
    const allDivs = Array.from(document.querySelectorAll('div'));
    let leftPanel = 0;  // Sidebar
    let middlePanel = 0;  // Editor
    let rightPanel = 0;  // Graph + Detail

    // This is a rough heuristic
    for (const div of allDivs) {
      if (div.textContent?.includes('Resources') && div.textContent?.includes('Servers')) {
        leftPanel = 1;
      }
      if (div.textContent?.includes('Edit Step:') || div.textContent?.includes('Configuration')) {
        middlePanel = 1;
      }
      if (div.textContent?.includes('Step Details') || div.className?.includes('detail')) {
        rightPanel = 1;
      }
    }

    return { leftPanel, middlePanel, rightPanel };
  });

  console.log(`\nPanel detection: Left=${panelCount.leftPanel}, Middle=${panelCount.middlePanel}, Right=${panelCount.rightPanel}`);

  expect(panelVisible).toBe(true);
});
