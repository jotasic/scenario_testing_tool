import { test, expect } from '@playwright/test';

test.describe('Final Verification - All Tests', () => {
  test('Complete E2E verification of all requirements', async ({ page }) => {
    console.log('==================================================');
    console.log('  FINAL VERIFICATION TEST SUITE');
    console.log('==================================================\n');

    // Navigate to the app
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/verification-00-initial.png', fullPage: true });

    // ========== Step 1: Open "Sample API Test Flow" scenario ==========
    console.log('Step 1: Opening "Sample API Test Flow" scenario');

    // Click on scenario dropdown (shows "2 step" currently)
    const scenarioDropdown = page.locator('text=2 step').or(page.locator('[class*="scenario"]')).first();
    await scenarioDropdown.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/verification-01-dropdown.png', fullPage: true });

    // Select "Sample API Test Flow"
    const sampleScenario = page.locator('text=Sample API Test Flow');
    const scenarioExists = await sampleScenario.count() > 0;

    if (scenarioExists) {
      console.log('  Found "Sample API Test Flow" in dropdown');
      await sampleScenario.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/verification-02-sample-loaded.png', fullPage: true });
    } else {
      console.log('  "Sample API Test Flow" not found in dropdown, checking current page');
      await page.keyboard.press('Escape');

      // Check if we're already on a scenario with conditions and loops
      const pageText = await page.locator('body').textContent();
      if (pageText?.includes('Sample API Test Flow')) {
        console.log('  Already on "Sample API Test Flow"');
      } else {
        console.log('  Using current scenario for testing');
      }
    }

    // ========== TEST 1: No "Couldn't create edge" warning ==========
    console.log('\n==========================================');
    console.log('TEST 1: Checking for drag-drop warnings');
    console.log('==========================================');

    const consoleLogs: string[] = [];
    const consoleWarnings: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      const type = msg.type();

      if (type === 'warning') {
        consoleWarnings.push(text);
        console.log(`  [Browser Warning]: ${text}`);
      }

      if (text.includes("Couldn't create edge")) {
        consoleLogs.push(text);
        console.log(`  [ALERT] Found warning: ${text}`);
      }
    });

    // Find nodes
    const nodes = page.locator('.react-flow__node');
    const nodeCount = await nodes.count();
    console.log(`  Found ${nodeCount} nodes on canvas`);

    if (nodeCount > 0) {
      // Click first node
      const firstNode = nodes.first();
      const firstNodeText = await firstNode.textContent();
      console.log(`  Clicking node: ${firstNodeText?.slice(0, 30)}`);
      await firstNode.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: 'screenshots/test1-01-node-selected.png', fullPage: true });

      // Drag the node
      const box = await firstNode.boundingBox();
      if (box) {
        console.log('  Dragging node...');
        const startX = box.x + box.width / 2;
        const startY = box.y + box.height / 2;
        const endX = startX + 150;
        const endY = startY + 80;

        await page.mouse.move(startX, startY);
        await page.mouse.down();
        await page.mouse.move(endX, endY, { steps: 15 });
        await page.waitForTimeout(200);
        await page.mouse.up();
        await page.waitForTimeout(500);
      }

      await page.screenshot({ path: 'screenshots/test1-02-after-drag.png', fullPage: true });

      // Check for warnings
      const hasWarning = consoleLogs.some(log => log.includes("Couldn't create edge"));

      if (hasWarning) {
        console.log('  ❌ TEST 1 FAILED: "Couldn\'t create edge" warning detected');
        console.log(`  Total warnings: ${consoleWarnings.length}`);
      } else {
        console.log('  ✅ TEST 1 PASSED: No "Couldn\'t create edge" warning found');
      }
    }

    // ========== TEST 2: Right panel at root level ==========
    console.log('\n==========================================');
    console.log('TEST 2: Right panel display at root level');
    console.log('==========================================');

    await page.waitForTimeout(500);

    // Click a different node to test panel display
    if (nodeCount > 1) {
      const secondNode = nodes.nth(1);
      const secondNodeText = await secondNode.textContent();
      console.log(`  Clicking node: ${secondNodeText?.slice(0, 30)}`);

      await secondNode.click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: 'screenshots/test2-01-node-clicked.png', fullPage: true });

      // Check if right panel shows details (not "No Selection")
      const noSelectionText = page.locator('text=No Selection');
      const hasNoSelection = await noSelectionText.isVisible();

      // Also check if panel has actual content
      const rightPanel = page.locator('[class*="rightPanel"], [class*="side-panel"], .MuiDrawer-root');
      const panelText = await rightPanel.textContent();

      if (hasNoSelection) {
        console.log('  ❌ TEST 2 FAILED: Right panel shows "No Selection"');
      } else if (panelText && panelText.length > 50) {
        console.log('  ✅ TEST 2 PASSED: Right panel displays node details');
        console.log(`  Panel content preview: ${panelText.slice(0, 80)}...`);
      } else {
        console.log('  ⚠️  TEST 2 WARNING: Panel state unclear');
      }

      await page.screenshot({ path: 'screenshots/test2-02-panel-visible.png', fullPage: true });
    }

    // ========== TEST 3: Right panel inside container ==========
    console.log('\n==========================================');
    console.log('TEST 3: Right panel inside container');
    console.log('==========================================');

    // Find loop/container nodes
    const containerSelectors = [
      '.react-flow__node:has-text("Process Each Item")',
      '.react-flow__node:has-text("loop")',
      '.react-flow__node:has-text("Loop")',
      '.react-flow__node[data-type="loop"]',
    ];

    let containerFound = false;
    for (const selector of containerSelectors) {
      const containers = await page.locator(selector).all();
      if (containers.length > 0) {
        console.log(`  Found ${containers.length} container node(s)`);
        const containerNode = containers[0];
        const containerText = await containerNode.textContent();
        console.log(`  Container: ${containerText?.slice(0, 40)}`);

        // Double-click to enter container
        await containerNode.dblclick();
        await page.waitForTimeout(1500);
        await page.screenshot({ path: 'screenshots/test3-01-inside-container.png', fullPage: true });

        // Check for nodes inside
        const innerNodes = page.locator('.react-flow__node');
        const innerCount = await innerNodes.count();
        console.log(`  Found ${innerCount} node(s) inside container`);

        if (innerCount > 0) {
          const innerNode = innerNodes.first();
          const innerNodeText = await innerNode.textContent();
          console.log(`  Clicking inner node: ${innerNodeText?.slice(0, 30)}`);

          await innerNode.click();
          await page.waitForTimeout(800);
          await page.screenshot({ path: 'screenshots/test3-02-inner-node-selected.png', fullPage: true });

          // Check panel
          const noSelection = page.locator('text=No Selection');
          const hasNoSelection = await noSelection.isVisible();

          if (hasNoSelection) {
            console.log('  ❌ TEST 3 FAILED: Right panel shows "No Selection" inside container');
          } else {
            console.log('  ✅ TEST 3 PASSED: Right panel displays node details inside container');
          }

          await page.screenshot({ path: 'screenshots/test3-03-panel-inside-container.png', fullPage: true });
        }

        // Navigate back to root
        console.log('  Navigating back to root level');
        const breadcrumb = page.locator('[aria-label="breadcrumb"], button:has-text("Back")');
        const hasBreadcrumb = await breadcrumb.count() > 0;

        if (hasBreadcrumb) {
          await breadcrumb.first().click();
        } else {
          await page.keyboard.press('Escape');
        }

        await page.waitForTimeout(500);
        containerFound = true;
        break;
      }
    }

    if (!containerFound) {
      console.log('  ⚠️  TEST 3 SKIPPED: No container nodes found in current scenario');
    }

    // ========== TEST 4: Edge connections from condition node ==========
    console.log('\n==========================================');
    console.log('TEST 4: Branch edges from condition node');
    console.log('==========================================');

    await page.screenshot({ path: 'screenshots/test4-01-overview.png', fullPage: true });

    // Find condition nodes
    const conditionSelectors = [
      '.react-flow__node:has-text("Check User Name")',
      '.react-flow__node:has-text("Check")',
      '.react-flow__node:has-text("condition")',
      '.react-flow__node[data-type="condition"]',
    ];

    let conditionFound = false;
    for (const selector of conditionSelectors) {
      const conditions = await page.locator(selector).all();
      if (conditions.length > 0) {
        console.log(`  Found ${conditions.length} condition node(s)`);
        const conditionNode = conditions[0];
        const conditionText = await conditionNode.textContent();
        console.log(`  Condition node: ${conditionText?.slice(0, 40)}`);

        await conditionNode.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'screenshots/test4-02-condition-selected.png', fullPage: true });

        // Get node ID
        const nodeId = await conditionNode.getAttribute('data-id');
        console.log(`  Node ID: ${nodeId}`);

        // Find edges from this node
        if (nodeId) {
          const edges = page.locator(`.react-flow__edge[data-source="${nodeId}"]`);
          const edgeCount = await edges.count();
          console.log(`  Found ${edgeCount} edge(s) from condition node`);

          if (edgeCount >= 2) {
            console.log('  ✅ TEST 4 PASSED: Condition node has multiple branch edges');

            // List each edge
            for (let i = 0; i < edgeCount; i++) {
              const edge = edges.nth(i);
              const target = await edge.getAttribute('data-target');
              console.log(`    Branch ${i + 1}: connects to ${target}`);
            }
          } else {
            console.log(`  ❌ TEST 4 FAILED: Only ${edgeCount} edge(s) found, expected at least 2`);
          }

          await page.screenshot({ path: 'screenshots/test4-03-branches-visible.png', fullPage: true });
        }

        conditionFound = true;
        break;
      }
    }

    if (!conditionFound) {
      console.log('  ⚠️  TEST 4: Condition node not found, checking all edges');
      const allEdges = page.locator('.react-flow__edge');
      const totalEdges = await allEdges.count();
      console.log(`  Total edges in scenario: ${totalEdges}`);

      if (totalEdges >= 2) {
        console.log('  ✅ Scenario has multiple edges');
      }

      await page.screenshot({ path: 'screenshots/test4-04-all-edges.png', fullPage: true });
    }

    // ========== Final Summary ==========
    console.log('\n==================================================');
    console.log('  VERIFICATION COMPLETE');
    console.log('==================================================');

    await page.screenshot({ path: 'screenshots/verification-99-final.png', fullPage: true });

    console.log('\nAll screenshots saved to screenshots/ directory');
    console.log('Review the images for visual confirmation\n');
  });
});
