import { test, expect } from '@playwright/test';

test.describe('Current Scenario Verification', () => {
  test('Run all verification tests on current scenario', async ({ page }) => {
    console.log('\n════════════════════════════════════════════════');
    console.log('         FINAL VERIFICATION TEST SUITE');
    console.log('════════════════════════════════════════════════\n');

    await page.goto('http://localhost:5173');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/final-00-loaded.png', fullPage: true });

    const scenarioName = await page.locator('h6').filter({ hasText: /step|Sample/ }).first().textContent();
    console.log(`📊 Current Scenario: ${scenarioName}\n`);

    // ══════════════════════════════════════════════
    // TEST 1: No "Couldn't create edge" warning
    // ══════════════════════════════════════════════
    console.log('TEST 1: Drag & Drop - No Edge Warning');
    console.log('────────────────────────────────────────');

    const consoleWarnings: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes("Couldn't create edge")) {
        consoleWarnings.push(msg.text());
      }
    });

    const nodes = page.locator('.react-flow__node');
    const nodeCount = await nodes.count();
    console.log(`  Nodes found: ${nodeCount}`);

    if (nodeCount > 0) {
      const firstNode = nodes.first();
      await firstNode.click();
      await page.waitForTimeout(300);

      const box = await firstNode.boundingBox();
      if (box) {
        console.log(`  Dragging first node...`);
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + 150, box.y + 80, { steps: 15 });
        await page.mouse.up();
        await page.waitForTimeout(600);
      }

      await page.screenshot({ path: 'screenshots/test1-after-drag.png', fullPage: true });

      if (consoleWarnings.length === 0) {
        console.log(`  ✅ PASS - No warnings detected`);
      } else {
        console.log(`  ❌ FAIL - ${consoleWarnings.length} warning(s):`);
        consoleWarnings.forEach(w => console.log(`     ${w}`));
      }
    }

    console.log('');

    // ══════════════════════════════════════════════
    // TEST 2: Right Panel - Root Level
    // ══════════════════════════════════════════════
    console.log('TEST 2: Right Panel at Root Level');
    console.log('────────────────────────────────────────');

    if (nodeCount > 1) {
      const secondNode = nodes.nth(1);
      const nodeName = await secondNode.textContent();
      console.log(`  Clicking node: ${nodeName?.slice(0, 30)}`);

      await secondNode.click();
      await page.waitForTimeout(1000);

      await page.screenshot({ path: 'screenshots/test2-panel-displayed.png', fullPage: true });

      // Check if panel shows content
      const hasNoSelection = await page.locator('text=No Selection').isVisible();

      // Check for panel elements
      const hasEditStep = await page.locator('text=/Edit Step|Request Details|Step:/').count() > 0;

      if (hasNoSelection) {
        console.log(`  ❌ FAIL - Panel shows "No Selection"`);
      } else if (hasEditStep) {
        console.log(`  ✅ PASS - Panel shows node details`);
      } else {
        console.log(`  ⚠️  UNCLEAR - Panel state uncertain`);
      }
    }

    console.log('');

    // ══════════════════════════════════════════════
    // TEST 3: Container Navigation (if available)
    // ══════════════════════════════════════════════
    console.log('TEST 3: Container Navigation');
    console.log('────────────────────────────────────────');

    const containerSelectors = [
      '.react-flow__node:has-text("Process Each Item")',
      '.react-flow__node:has-text("loop")',
      '.react-flow__node:has-text("Loop")',
    ];

    let containerTested = false;
    for (const selector of containerSelectors) {
      const containers = await page.locator(selector).all();
      if (containers.length > 0) {
        const container = containers[0];
        const containerText = await container.textContent();
        console.log(`  Found container: ${containerText?.slice(0, 30)}`);

        await container.dblclick();
        await page.waitForTimeout(1500);

        await page.screenshot({ path: 'screenshots/test3-inside-container.png', fullPage: true });

        const innerNodes = page.locator('.react-flow__node');
        const innerCount = await innerNodes.count();
        console.log(`  Inner nodes: ${innerCount}`);

        if (innerCount > 0) {
          await innerNodes.first().click();
          await page.waitForTimeout(1000);

          await page.screenshot({ path: 'screenshots/test3-inner-panel.png', fullPage: true });

          const hasNoSelection = await page.locator('text=No Selection').isVisible();
          const hasDetails = await page.locator('text=/Edit Step|Request Details/').count() > 0;

          if (hasNoSelection) {
            console.log(`  ❌ FAIL - Panel shows "No Selection" inside container`);
          } else if (hasDetails) {
            console.log(`  ✅ PASS - Panel works inside container`);
          } else {
            console.log(`  ⚠️  UNCLEAR - Panel state uncertain`);
          }
        }

        // Go back
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);

        containerTested = true;
        break;
      }
    }

    if (!containerTested) {
      console.log(`  ⚠️  SKIP - No container nodes in this scenario`);
    }

    console.log('');

    // ══════════════════════════════════════════════
    // TEST 4: Branch Edges (if available)
    // ══════════════════════════════════════════════
    console.log('TEST 4: Branch Edges from Condition Node');
    console.log('────────────────────────────────────────');

    const conditionSelectors = [
      '.react-flow__node:has-text("Check User Name")',
      '.react-flow__node:has-text("Check")',
      '.react-flow__node:has-text("condition")',
    ];

    let conditionTested = false;
    for (const selector of conditionSelectors) {
      const conditions = await page.locator(selector).all();
      if (conditions.length > 0) {
        const condition = conditions[0];
        const conditionText = await condition.textContent();
        console.log(`  Found condition: ${conditionText?.slice(0, 30)}`);

        await condition.click();
        await page.waitForTimeout(500);

        await page.screenshot({ path: 'screenshots/test4-condition-selected.png', fullPage: true });

        const nodeId = await condition.getAttribute('data-id');
        if (nodeId) {
          const edges = page.locator(`.react-flow__edge[data-source="${nodeId}"]`);
          const edgeCount = await edges.count();
          console.log(`  Outgoing edges: ${edgeCount}`);

          if (edgeCount >= 2) {
            console.log(`  ✅ PASS - ${edgeCount} branch edges found`);
          } else if (edgeCount === 1) {
            console.log(`  ⚠️  WARNING - Only 1 edge found, expected 2+`);
          } else {
            console.log(`  ❌ FAIL - No edges found`);
          }
        }

        conditionTested = true;
        break;
      }
    }

    if (!conditionTested) {
      console.log(`  ⚠️  SKIP - No condition nodes in this scenario`);

      // Show general edge info
      const allEdges = page.locator('.react-flow__edge');
      const totalEdges = await allEdges.count();
      console.log(`  Total edges in scenario: ${totalEdges}`);
    }

    console.log('');

    // Final screenshot
    await page.screenshot({ path: 'screenshots/final-99-complete.png', fullPage: true });

    console.log('════════════════════════════════════════════════');
    console.log('              TESTS COMPLETE');
    console.log('════════════════════════════════════════════════\n');
    console.log('📸 Screenshots saved to: screenshots/');
    console.log('');
  });
});
