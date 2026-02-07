import { test } from '@playwright/test';

test('Simple verification: Panel visibility at root vs nested', async ({ page }) => {
  await page.goto('http://localhost:5186');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  console.log('\n=== Phase 1: Root Level ===');
  await page.screenshot({ path: 'simple-1-loaded.png', fullPage: true });

  // Click first node at root
  console.log('Clicking first node at root level...');
  const firstNode = page.locator('.react-flow__node').first();
  await firstNode.click({ timeout: 10000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'simple-2-root-node-clicked.png', fullPage: true });

  // Check right side of graph panel for detail content
  let detailVisible = await page.evaluate(() => {
    const body = document.body.textContent || '';
    // Look for unique strings that would be in StepDetailPanel
    return body.includes('Step Details') || body.includes('Request Details') || body.includes('Condition Details');
  });
  console.log(`At root level - Detail panel visible: ${detailVisible ? 'YES ✅' : 'NO ❌'}`);

  console.log('\n=== Phase 2: Inside Container ===');

  // Find loop node and double-click it
  console.log('Looking for loop container...');
  const loopNode = page.locator('.react-flow__node').filter({ hasText: /Process|Loop/i }).first();
  const loopExists = await loopNode.count();

  if (loopExists === 0) {
    console.log('No loop container found - test incomplete');
    return;
  }

  console.log('Double-clicking loop container...');
  await loopNode.dblclick({ timeout: 10000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'simple-3-navigated-inside.png', fullPage: true });

  // Check if breadcrumbs show navigation
  const breadcrumbArea = await page.locator('div').filter({ hasText: /Main Flow|Root/i }).first().textContent().catch(() => 'none');
  console.log(`Breadcrumb area: ${breadcrumbArea.substring(0, 100)}`);

  // Click first node inside container
  console.log('Clicking first node inside container...');
  const innerNode = page.locator('.react-flow__node').first();
  await innerNode.click({ timeout: 10000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'simple-4-inner-node-clicked.png', fullPage: true });

  // Check right side again
  detailVisible = await page.evaluate(() => {
    const body = document.body.textContent || '';
    return body.includes('Step Details') || body.includes('Request Details') || body.includes('Condition Details');
  });
  console.log(`Inside container - Detail panel visible: ${detailVisible ? 'YES ✅' : 'NO ❌'}`);

  // Count visible panels by looking at the layout
  const layoutInfo = await page.evaluate(() => {
    const allDivs = Array.from(document.querySelectorAll('div'));
    const hasLeftPanel = allDivs.some(d => (d.textContent || '').includes('Resources') && (d.textContent || '').includes('Steps'));
    const hasMiddlePanel = allDivs.some(d => (d.textContent || '').includes('Configuration') || (d.textContent || '').includes('Edit Step'));
    const hasRightCanvas = allDivs.some(d => (d.textContent || '').includes('AUTO LAYOUT'));

    // Look for StepDetailPanel specifically
    const hasStepDetailPanel = allDivs.some(d => {
      const text = d.textContent || '';
      return text.includes('Step Details') || text.includes('Request Details');
    });

    return {
      left: hasLeftPanel,
      middle: hasMiddlePanel,
      canvas: hasRightCanvas,
      detailPanel: hasStepDetailPanel
    };
  });

  console.log('\nLayout analysis:');
  console.log(`- Left panel (Resources): ${layoutInfo.left}`);
  console.log(`- Middle panel (Editor): ${layoutInfo.middle}`);
  console.log(`- Canvas area: ${layoutInfo.canvas}`);
  console.log(`- Detail panel (RIGHT of canvas): ${layoutInfo.detailPanel}`);

  console.log('\n=== Test Complete ===');
  console.log('Check the screenshots:');
  console.log('- simple-2-root-node-clicked.png (should show detail panel)');
  console.log('- simple-4-inner-node-clicked.png (should ALSO show detail panel after fix)');
});
