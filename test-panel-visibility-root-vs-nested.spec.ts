import { test, expect } from '@playwright/test';

test('Test right panel visibility: Root vs Nested containers', async ({ page }) => {
  // Navigate to the application
  console.log('\n=== Navigating to application ===');
  await page.goto('http://localhost:5186');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  console.log('\n=== PART 1: Testing at ROOT LEVEL ===');

  // Click on a root-level node in the canvas
  console.log('Clicking "Get User" node in canvas...');
  const getUserNode = page.locator('.react-flow__node').filter({ hasText: 'Get User' }).first();
  await getUserNode.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-1-root-node-clicked.png', fullPage: true });

  // Check if right panel exists
  let rightPanelText = await page.evaluate(() => {
    const allDivs = Array.from(document.querySelectorAll('div'));
    for (const div of allDivs) {
      const text = div.textContent || '';
      if (text.includes('Step Details') || text.includes('Execution Mode') || text.includes('Server')) {
        return div.textContent;
      }
    }
    return null;
  });

  console.log(`Right panel at root level: ${rightPanelText ? 'VISIBLE' : 'NOT VISIBLE'}`);
  if (rightPanelText) {
    console.log(`Panel content preview: ${rightPanelText.substring(0, 100)}...`);
  }

  // Check Redux state
  let reduxState = await page.evaluate(() => {
    const win = window as any;
    if (win.__REDUX_DEVTOOLS_EXTENSION__) {
      return {
        selectedStepId: win.store?.getState()?.ui?.selectedStepId || null,
        navigationPath: win.store?.getState()?.ui?.navigationPath || null
      };
    }
    return null;
  });
  console.log(`Redux state at root:`, reduxState);

  console.log('\n=== PART 2: Navigating INTO Loop Container ===');

  // Find and double-click the loop node to navigate inside
  console.log('Double-clicking "Process Each Item" loop node...');
  const loopNode = page.locator('.react-flow__node').filter({ hasText: 'Process Each Item' }).first();
  await loopNode.dblclick();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'test-2-inside-loop.png', fullPage: true });

  // Check if breadcrumbs show we're inside the container
  const breadcrumbText = await page.locator('nav, [role="navigation"]').first().textContent().catch(() => '');
  console.log(`Breadcrumbs: ${breadcrumbText}`);

  console.log('\n=== PART 3: Clicking Node INSIDE Container ===');

  // Click a node inside the loop
  console.log('Clicking first node inside loop container...');
  const innerNode = page.locator('.react-flow__node').first();
  await innerNode.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-3-inner-node-clicked.png', fullPage: true });

  // Check if right panel exists
  rightPanelText = await page.evaluate(() => {
    const allDivs = Array.from(document.querySelectorAll('div'));
    for (const div of allDivs) {
      const text = div.textContent || '';
      if (text.includes('Step Details') || text.includes('Execution Mode') || text.includes('Server')) {
        return div.textContent;
      }
    }
    return null;
  });

  console.log(`Right panel inside container: ${rightPanelText ? 'VISIBLE' : 'NOT VISIBLE'}`);
  if (!rightPanelText) {
    console.log('❌ BUG CONFIRMED: Right panel does NOT show when clicking node inside container');
  }

  // Check Redux state again
  reduxState = await page.evaluate(() => {
    const win = window as any;
    // Try to access Redux state through various methods
    if (win.store) {
      return win.store.getState();
    }
    return null;
  });

  console.log(`Redux state inside container:`, reduxState ? JSON.stringify({
    selectedStepId: reduxState.ui?.selectedStepId,
    navigationPath: reduxState.ui?.navigationPath || 'N/A'
  }, null, 2) : 'Unable to access');

  // Try to extract state from React DevTools or other sources
  const stateInfo = await page.evaluate(() => {
    const reactRoot = document.querySelector('#root');
    if (reactRoot) {
      const keys = Object.keys(reactRoot);
      const reactKey = keys.find(key => key.startsWith('__react'));
      if (reactKey) {
        const fiber = (reactRoot as any)[reactKey];
        // This is a simplified way to check - real implementation would traverse fiber tree
        return { found: true, fiberExists: !!fiber };
      }
    }
    return { found: false };
  });
  console.log('React root inspection:', stateInfo);

  console.log('\n=== PART 4: Navigate Back to Root ===');

  // Try clicking "Root" breadcrumb or escape key
  const rootLink = page.getByText('Root').first();
  const rootLinkExists = await rootLink.isVisible().catch(() => false);

  if (rootLinkExists) {
    console.log('Clicking "Root" breadcrumb...');
    await rootLink.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-4-back-to-root.png', fullPage: true });
  } else {
    console.log('No "Root" breadcrumb found - using alternative navigation');
    // Try clicking outside the canvas
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // Click root node again
  console.log('Clicking "Get User" node again...');
  await getUserNode.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-5-root-node-again.png', fullPage: true });

  rightPanelText = await page.evaluate(() => {
    const allDivs = Array.from(document.querySelectorAll('div'));
    for (const div of allDivs) {
      const text = div.textContent || '';
      if (text.includes('Step Details') || text.includes('Execution Mode') || text.includes('Server')) {
        return div.textContent;
      }
    }
    return null;
  });

  console.log(`Right panel back at root: ${rightPanelText ? 'VISIBLE ✅' : 'NOT VISIBLE ❌'}`);

  console.log('\n=== TEST COMPLETE ===');
  console.log('Summary:');
  console.log('- Root level node click: Right panel should be VISIBLE');
  console.log('- Inside container node click: Right panel should be VISIBLE but is NOT (BUG)');
  console.log('- The issue is in ConfigPage.tsx line 1256:');
  console.log('  const showDetailPanel = selectedStepId !== null && navigationPath.length === 0;');
  console.log('- This condition prevents panel from showing when navigationPath is not empty');
});
