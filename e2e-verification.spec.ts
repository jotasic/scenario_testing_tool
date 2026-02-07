import { test, expect } from '@playwright/test';

test.describe('Final Verification Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Open "Sample API Test Flow" scenario
    await page.click('text=Sample API Test Flow');
    await page.waitForTimeout(1000);
  });

  test('TEST 1 - No warning after drag and drop', async ({ page }) => {
    console.log('TEST 1: Checking for "Couldn\'t create edge" warnings');

    // Clear console
    page.on('console', msg => {
      console.log(`Browser console [${msg.type()}]: ${msg.text()}`);
    });

    // Find a node and drag it
    const node = page.locator('.react-flow__node').first();
    await node.click();
    await page.screenshot({ path: 'screenshots/test1-before-drag.png', fullPage: true });

    // Drag the node
    const box = await node.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + 100, box.y + 100, { steps: 10 });
      await page.mouse.up();
    }

    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/test1-after-drag.png', fullPage: true });

    // Check console for errors
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });

    await page.waitForTimeout(1000);

    // Verify no "Couldn't create edge" warning
    const hasWarning = consoleLogs.some(log => log.includes("Couldn't create edge"));
    expect(hasWarning).toBe(false);

    console.log('TEST 1 PASSED: No "Couldn\'t create edge" warning found');
  });

  test('TEST 2 - Right panel shows when clicking node at root level', async ({ page }) => {
    console.log('TEST 2: Checking right panel at root level');

    await page.screenshot({ path: 'screenshots/test2-before-click.png', fullPage: true });

    // Click a node
    const node = page.locator('.react-flow__node').first();
    await node.click();
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'screenshots/test2-after-click.png', fullPage: true });

    // Check if right panel is visible
    const rightPanel = page.locator('[class*="rightPanel"], [class*="side-panel"], [class*="details"]');
    await expect(rightPanel).toBeVisible({ timeout: 2000 });

    console.log('TEST 2 PASSED: Right panel is visible');
  });

  test('TEST 3 - Right panel shows when clicking node inside container', async ({ page }) => {
    console.log('TEST 3: Checking right panel inside container');

    // Find and double-click "Process Each Item" loop
    const loopNode = page.locator('.react-flow__node:has-text("Process Each Item")');
    await loopNode.dblclick();
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'screenshots/test3-inside-container.png', fullPage: true });

    // Click a node inside the container
    const innerNode = page.locator('.react-flow__node').first();
    await innerNode.click();
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'screenshots/test3-panel-visible.png', fullPage: true });

    // Check if right panel is visible
    const rightPanel = page.locator('[class*="rightPanel"], [class*="side-panel"], [class*="details"]');
    await expect(rightPanel).toBeVisible({ timeout: 2000 });

    console.log('TEST 3 PASSED: Right panel is visible inside container');
  });

  test('TEST 4 - Edge connections from condition node', async ({ page }) => {
    console.log('TEST 4: Checking edge connections from "Check User Name"');

    await page.screenshot({ path: 'screenshots/test4-full-view.png', fullPage: true });

    // Find the "Check User Name" condition node
    const conditionNode = page.locator('.react-flow__node:has-text("Check User Name")');
    await expect(conditionNode).toBeVisible();

    // Highlight the node
    await conditionNode.click();
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'screenshots/test4-condition-node.png', fullPage: true });

    // Check for edges from this node
    // Get the node's data-id
    const nodeId = await conditionNode.getAttribute('data-id');

    // Find edges that start from this node
    const edges = page.locator(`.react-flow__edge[data-source="${nodeId}"]`);
    const edgeCount = await edges.count();

    console.log(`Found ${edgeCount} edges from "Check User Name" node`);
    expect(edgeCount).toBeGreaterThanOrEqual(2);

    await page.screenshot({ path: 'screenshots/test4-edges-connected.png', fullPage: true });

    console.log('TEST 4 PASSED: Condition node has multiple branch edges');
  });
});
