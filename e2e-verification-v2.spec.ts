import { test, expect } from '@playwright/test';

test.describe('Final Verification Tests', () => {
  test('Complete verification flow', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/00-initial.png', fullPage: true });

    // Click LOAD button to find "Sample API Test Flow"
    console.log('Step 1: Opening Load dialog');
    await page.click('button:has-text("LOAD")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/01-load-dialog.png', fullPage: true });

    // Look for "Sample API Test Flow" in the dialog
    const sampleScenario = page.locator('text=Sample API Test Flow');
    const scenarioExists = await sampleScenario.count() > 0;

    if (scenarioExists) {
      console.log('Found "Sample API Test Flow", clicking it');
      await sampleScenario.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/02-scenario-loaded.png', fullPage: true });
    } else {
      console.log('Sample API Test Flow not found, using current scenario for testing');
      // Close dialog if it's open
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // TEST 1: Check for "Couldn't create edge" warnings
    console.log('\n========== TEST 1: Checking for drag-drop warnings ==========');

    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes("Couldn't create edge")) {
        console.log('WARNING FOUND:', text);
      }
    });

    // Find a node and drag it
    const nodes = page.locator('.react-flow__node');
    const nodeCount = await nodes.count();
    console.log(`Found ${nodeCount} nodes`);

    if (nodeCount > 0) {
      const firstNode = nodes.first();
      await firstNode.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: 'screenshots/test1-01-before-drag.png', fullPage: true });

      // Drag the node
      const box = await firstNode.boundingBox();
      if (box) {
        console.log('Dragging node...');
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + 100, box.y + 50, { steps: 10 });
        await page.mouse.up();
        await page.waitForTimeout(500);
      }

      await page.screenshot({ path: 'screenshots/test1-02-after-drag.png', fullPage: true });

      // Check console for warnings
      const hasWarning = consoleLogs.some(log => log.includes("Couldn't create edge"));
      if (hasWarning) {
        console.log('TEST 1 FAILED: "Couldn\'t create edge" warning found in console');
      } else {
        console.log('TEST 1 PASSED: No "Couldn\'t create edge" warning found');
      }
    }

    // TEST 2: Right panel at root level
    console.log('\n========== TEST 2: Right panel at root level ==========');

    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/test2-01-before-click.png', fullPage: true });

    // Click a node
    if (nodeCount > 1) {
      const secondNode = nodes.nth(1);
      await secondNode.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'screenshots/test2-02-after-click.png', fullPage: true });

      // Check if Configuration panel shows content (not "No Selection")
      const configPanel = page.locator('text=No Selection');
      const hasNoSelection = await configPanel.isVisible();

      if (hasNoSelection) {
        console.log('TEST 2 FAILED: Right panel still shows "No Selection"');
      } else {
        console.log('TEST 2 PASSED: Right panel shows node details');
      }
    }

    // TEST 3: Right panel inside container
    console.log('\n========== TEST 3: Right panel inside container ==========');

    // Look for any loop/container nodes
    const loopNodes = await page.locator('.react-flow__node:has-text("loop"), .react-flow__node:has-text("Loop"), .react-flow__node:has-text("Process")').all();

    if (loopNodes.length > 0) {
      console.log(`Found ${loopNodes.length} potential container nodes`);
      const loopNode = loopNodes[0];

      await loopNode.dblclick();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'screenshots/test3-01-inside-container.png', fullPage: true });

      // Click a node inside
      const innerNodes = page.locator('.react-flow__node');
      const innerCount = await innerNodes.count();
      console.log(`Found ${innerCount} nodes inside container`);

      if (innerCount > 0) {
        await innerNodes.first().click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'screenshots/test3-02-panel-visible.png', fullPage: true });

        const configPanel = page.locator('text=No Selection');
        const hasNoSelection = await configPanel.isVisible();

        if (hasNoSelection) {
          console.log('TEST 3 FAILED: Right panel shows "No Selection" inside container');
        } else {
          console.log('TEST 3 PASSED: Right panel shows node details inside container');
        }
      }

      // Navigate back to root
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } else {
      console.log('TEST 3 SKIPPED: No container nodes found');
    }

    // TEST 4: Edge connections
    console.log('\n========== TEST 4: Edge connections from condition node ==========');

    await page.screenshot({ path: 'screenshots/test4-01-full-view.png', fullPage: true });

    // Find condition nodes
    const conditionNodes = await page.locator('.react-flow__node:has-text("Check"), .react-flow__node:has-text("condition"), .react-flow__node:has-text("if")').all();

    if (conditionNodes.length > 0) {
      console.log(`Found ${conditionNodes.length} potential condition nodes`);
      const conditionNode = conditionNodes[0];

      await conditionNode.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'screenshots/test4-02-condition-selected.png', fullPage: true });

      // Get node ID
      const nodeId = await conditionNode.getAttribute('data-id');
      console.log(`Condition node ID: ${nodeId}`);

      // Find edges from this node
      if (nodeId) {
        const edges = page.locator(`.react-flow__edge[data-source="${nodeId}"]`);
        const edgeCount = await edges.count();
        console.log(`Found ${edgeCount} edges from condition node`);

        if (edgeCount >= 2) {
          console.log('TEST 4 PASSED: Condition node has multiple branch edges');
        } else {
          console.log(`TEST 4 WARNING: Only ${edgeCount} edge(s) found, expected at least 2`);
        }

        await page.screenshot({ path: 'screenshots/test4-03-edges-highlighted.png', fullPage: true });
      }
    } else {
      console.log('TEST 4: No condition nodes found, checking all edges');
      const allEdges = page.locator('.react-flow__edge');
      const totalEdges = await allEdges.count();
      console.log(`Total edges in scenario: ${totalEdges}`);
      await page.screenshot({ path: 'screenshots/test4-04-all-edges.png', fullPage: true });
    }

    // Final screenshot
    await page.screenshot({ path: 'screenshots/99-final.png', fullPage: true });
    console.log('\n========== All tests completed ==========');
  });
});
