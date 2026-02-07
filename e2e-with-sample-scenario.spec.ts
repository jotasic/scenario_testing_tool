import { test, expect } from '@playwright/test';

test.describe('Final Verification with Sample Scenario', () => {
  test('Switch to Sample API Test Flow and run all tests', async ({ page }) => {
    console.log('==================================================');
    console.log('  FINAL VERIFICATION - SAMPLE API TEST FLOW');
    console.log('==================================================\n');

    // Navigate to the app
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/final-00-initial.png', fullPage: true });

    // Inject script to switch to Sample API Test Flow scenario
    console.log('Switching to "Sample API Test Flow" scenario...');

    const switched = await page.evaluate(() => {
      // Access Redux store from window (assuming it's exposed in dev mode)
      const store = (window as any).store;
      if (!store) {
        console.log('Redux store not found on window');
        return false;
      }

      const state = store.getState();
      const scenarios = state.scenarios.present.scenarios;
      const sampleScenario = scenarios.find((s: any) => s.name === 'Sample API Test Flow');

      if (sampleScenario) {
        // Dispatch action to change scenario
        store.dispatch({
          type: 'scenarios/setCurrentScenario',
          payload: sampleScenario.id,
        });
        console.log(`Switched to scenario: ${sampleScenario.name} (${sampleScenario.id})`);
        return true;
      }

      console.log('Sample API Test Flow not found in scenarios list');
      return false;
    });

    if (!switched) {
      console.log('Failed to switch scenario via Redux. Trying manual approach...');

      // Alternative: Use localStorage/IndexedDB to switch scenario
      await page.evaluate(() => {
        // Try to access scenarios from state
        const scenarios = [
          { id: 'scn_sample_001', name: 'Sample API Test Flow' },
        ];

        // Set current scenario ID in localStorage
        localStorage.setItem('currentScenarioId', 'scn_sample_001');
      });

      // Reload page
      await page.reload();
      await page.waitForTimeout(2000);
    }

    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/final-01-scenario-switched.png', fullPage: true });

    // Verify we're on the correct scenario
    const scenarioName = await page.locator('text=/Sample API Test Flow|2 step/').textContent();
    console.log(`Current scenario: ${scenarioName}`);

    // ========== TEST 1: No warning on drag ==========
    console.log('\n========== TEST 1: Drag without warning ==========');

    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes("Couldn't create edge")) {
        consoleLogs.push(text);
        console.log(`  [WARNING DETECTED]: ${text}`);
      }
    });

    const nodes = page.locator('.react-flow__node');
    const nodeCount = await nodes.count();
    console.log(`  Found ${nodeCount} nodes`);

    if (nodeCount > 0) {
      await nodes.first().click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: 'screenshots/final-test1-before-drag.png', fullPage: true });

      const box = await nodes.first().boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + 120, box.y + 60, { steps: 12 });
        await page.mouse.up();
        await page.waitForTimeout(500);
      }

      await page.screenshot({ path: 'screenshots/final-test1-after-drag.png', fullPage: true });

      if (consoleLogs.length === 0) {
        console.log('  ✅ PASS: No "Couldn\'t create edge" warning');
      } else {
        console.log(`  ❌ FAIL: ${consoleLogs.length} warning(s) found`);
      }
    }

    // ========== TEST 2: Right panel at root ==========
    console.log('\n========== TEST 2: Right panel at root level ==========');

    if (nodeCount > 1) {
      await nodes.nth(1).click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: 'screenshots/final-test2-panel.png', fullPage: true });

      const noSelection = await page.locator('text=No Selection').isVisible();
      if (!noSelection) {
        console.log('  ✅ PASS: Right panel shows content');
      } else {
        console.log('  ❌ FAIL: Panel shows "No Selection"');
      }
    }

    // ========== TEST 3: Container navigation ==========
    console.log('\n========== TEST 3: Inside container ==========');

    const loopNode = page.locator('.react-flow__node:has-text("Process Each Item")').first();
    if (await loopNode.count() > 0) {
      console.log('  Found "Process Each Item" loop node');
      await loopNode.dblclick();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'screenshots/final-test3-inside-loop.png', fullPage: true });

      const innerNodes = page.locator('.react-flow__node');
      const innerCount = await innerNodes.count();
      console.log(`  Found ${innerCount} node(s) inside`);

      if (innerCount > 0) {
        await innerNodes.first().click();
        await page.waitForTimeout(800);
        await page.screenshot({ path: 'screenshots/final-test3-inner-panel.png', fullPage: true });

        const noSelection = await page.locator('text=No Selection').isVisible();
        if (!noSelection) {
          console.log('  ✅ PASS: Panel works inside container');
        } else {
          console.log('  ❌ FAIL: No panel inside container');
        }
      }

      // Go back
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } else {
      console.log('  ⚠️  SKIP: Loop node not found');
    }

    // ========== TEST 4: Branch edges ==========
    console.log('\n========== TEST 4: Branch edges from condition ==========');

    const conditionNode = page.locator('.react-flow__node:has-text("Check User Name")').first();
    if (await conditionNode.count() > 0) {
      console.log('  Found "Check User Name" condition node');
      await conditionNode.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'screenshots/final-test4-condition.png', fullPage: true });

      const nodeId = await conditionNode.getAttribute('data-id');
      if (nodeId) {
        const edges = page.locator(`.react-flow__edge[data-source="${nodeId}"]`);
        const edgeCount = await edges.count();
        console.log(`  Found ${edgeCount} edge(s) from condition`);

        if (edgeCount >= 2) {
          console.log('  ✅ PASS: Multiple branches connected');
        } else {
          console.log(`  ❌ FAIL: Expected 2+ edges, found ${edgeCount}`);
        }
      }
    } else {
      console.log('  ⚠️  SKIP: Condition node not found');
    }

    await page.screenshot({ path: 'screenshots/final-99-complete.png', fullPage: true });

    console.log('\n==================================================');
    console.log('  ALL TESTS COMPLETE');
    console.log('==================================================');
  });
});
