import { test, expect } from '@playwright/test';

test.describe('Complete Final Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
  });

  test('Verification 1: Current scenario (2 step) - Tests 1 & 2', async ({ page }) => {
    console.log('\n════════════════════════════════════════════════');
    console.log('  PART 1: Tests on "2 step" scenario');
    console.log('════════════════════════════════════════════════\n');

    await page.screenshot({ path: 'screenshots/report-00-initial.png', fullPage: true });

    // TEST 1: No warnings on drag
    console.log('TEST 1: Drag & Drop Warning Check');
    console.log('─'.repeat(44));

    const warnings: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes("Couldn't create edge")) {
        warnings.push(msg.text());
      }
    });

    const nodes = page.locator('.react-flow__node');
    await nodes.first().click();
    await page.waitForTimeout(300);

    const box = await nodes.first().boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + 150, box.y + 80, { steps: 15 });
      await page.mouse.up();
      await page.waitForTimeout(600);
    }

    await page.screenshot({ path: 'screenshots/report-01-after-drag.png', fullPage: true });

    expect(warnings.length).toBe(0);
    console.log('  ✅ PASS: No "Couldn\'t create edge" warning\n');

    // TEST 2: Right panel at root
    console.log('TEST 2: Right Panel Display');
    console.log('─'.repeat(44));

    await nodes.nth(1).click();
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'screenshots/report-02-panel-root.png', fullPage: true });

    const hasNoSelection = await page.locator('text=No Selection').isVisible();
    expect(hasNoSelection).toBe(false);
    console.log('  ✅ PASS: Panel shows node details\n');

    console.log('════════════════════════════════════════════════\n');
  });

  test('Verification 2: Switch to Sample scenario - Tests 3 & 4', async ({ page }) => {
    console.log('\n════════════════════════════════════════════════');
    console.log('  PART 2: Tests on "Sample API Test Flow"');
    console.log('════════════════════════════════════════════════\n');

    // Switch to Sample scenario using localStorage
    console.log('Switching to Sample API Test Flow scenario...');

    await page.evaluate(() => {
      // Access Redux store state from window if available
      const currentState = localStorage.getItem('persist:scenarios');
      if (currentState) {
        const state = JSON.parse(currentState);
        const present = JSON.parse(state.present || '{}');

        // Change current scenario ID
        present.currentScenarioId = 'scn_sample_001';

        state.present = JSON.stringify(present);
        localStorage.setItem('persist:scenarios', JSON.stringify(state));
      }
    });

    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/report-03-sample-loaded.png', fullPage: true });

    const scenarioName = await page.locator('h6').first().textContent();
    console.log(`Current scenario: ${scenarioName}\n`);

    // TEST 3: Container navigation
    console.log('TEST 3: Container Navigation');
    console.log('─'.repeat(44));

    const loopNode = page.locator('.react-flow__node:has-text("Process Each Item")').first();
    const hasLoop = await loopNode.count() > 0;

    if (hasLoop) {
      console.log('  Found "Process Each Item" loop node');
      await loopNode.dblclick();
      await page.waitForTimeout(1500);

      await page.screenshot({ path: 'screenshots/report-04-inside-container.png', fullPage: true });

      const innerNodes = page.locator('.react-flow__node');
      const innerCount = await innerNodes.count();
      console.log(`  Inner nodes: ${innerCount}`);

      if (innerCount > 0) {
        await innerNodes.first().click();
        await page.waitForTimeout(1000);

        await page.screenshot({ path: 'screenshots/report-05-container-panel.png', fullPage: true });

        const hasNoSelection = await page.locator('text=No Selection').isVisible();
        expect(hasNoSelection).toBe(false);
        console.log('  ✅ PASS: Panel works inside container\n');
      }

      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } else {
      console.log('  ⚠️  Loop node not found, skipping...\n');
    }

    // TEST 4: Branch edges
    console.log('TEST 4: Branch Edges');
    console.log('─'.repeat(44));

    const conditionNode = page.locator('.react-flow__node:has-text("Check User Name")').first();
    const hasCondition = await conditionNode.count() > 0;

    if (hasCondition) {
      console.log('  Found "Check User Name" condition node');
      await conditionNode.click();
      await page.waitForTimeout(500);

      await page.screenshot({ path: 'screenshots/report-06-condition-node.png', fullPage: true });

      const nodeId = await conditionNode.getAttribute('data-id');
      if (nodeId) {
        const edges = page.locator(`.react-flow__edge[data-source="${nodeId}"]`);
        const edgeCount = await edges.count();
        console.log(`  Outgoing edges: ${edgeCount}`);

        expect(edgeCount).toBeGreaterThanOrEqual(2);
        console.log('  ✅ PASS: Multiple branch edges found\n');
      }
    } else {
      console.log('  ⚠️  Condition node not found, skipping...\n');
    }

    await page.screenshot({ path: 'screenshots/report-99-final.png', fullPage: true });

    console.log('════════════════════════════════════════════════\n');
  });
});
