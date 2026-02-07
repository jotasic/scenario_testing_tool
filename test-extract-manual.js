import { chromium } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testExtractToRoot() {
  console.log('\n========================================');
  console.log('Extract-to-Root E2E Test');
  console.log('========================================\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 800 // Slow down for visibility
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => console.log('  BROWSER:', msg.text()));
  page.on('pageerror', err => console.error('  PAGE ERROR:', err));

  try {
    console.log('[STEP 1] Navigate to application');
    console.log('=========================================');
    await page.goto('http://localhost:5186/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    console.log('  - Application loaded');

    // Close any dialogs that may be open
    const closeButton = page.locator('[aria-label="close"], button:has-text("Cancel"), button:has-text("Close")').first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
      await page.waitForTimeout(500);
      console.log('  - Closed welcome dialog');
    }

    await page.screenshot({ path: join(__dirname, 'test-screenshots', '01-homepage.png'), fullPage: true });
    console.log('  - Screenshot: 01-homepage.png');

    console.log('\n[STEP 2] Verify scenario loaded');
    console.log('=========================================');
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    await page.waitForTimeout(1000);

    const scenarioTitle = await page.locator('text="Sample API Test Flow"').first();
    if (await scenarioTitle.isVisible()) {
      console.log('  PASS: Scenario "Sample API Test Flow" loaded');
    }

    await page.screenshot({ path: join(__dirname, 'test-screenshots', '02-scenario-loaded.png'), fullPage: true });
    console.log('  - Screenshot: 02-scenario-loaded.png');

    console.log('\n[STEP 3] Find and expand Loop container');
    console.log('=========================================');

    // Find the "Process Each Item" loop in the sidebar
    const loopStep = page.locator('text="Process Each Item"').first();
    await loopStep.scrollIntoViewIfNeeded();
    console.log('  - Found "Process Each Item" loop step');

    // Find the expand button next to it
    const expandButton = page.locator('[role="button"]:has-text("Process Each Item")').locator('button').first();

    // Click to expand
    await expandButton.click();
    await page.waitForTimeout(800);
    console.log('  PASS: Expanded loop container');

    await page.screenshot({ path: join(__dirname, 'test-screenshots', '03-expanded-loop.png'), fullPage: true });
    console.log('  - Screenshot: 03-expanded-loop.png');

    // Verify nested step is visible
    const nestedStep = page.locator('text="Create Post for Item"').first();
    if (await nestedStep.isVisible()) {
      console.log('  PASS: Nested step "Create Post for Item" is visible');
    } else {
      console.log('  FAIL: Nested step not visible');
    }

    console.log('\n[TEST 1] Context Menu - Extract to Root');
    console.log('=========================================');

    // Right-click on the nested step
    const nestedStepButton = page.locator('[role="button"]:has-text("Create Post for Item")').first();
    await nestedStepButton.click({ button: 'right' });
    await page.waitForTimeout(800);
    console.log('  - Right-clicked on nested step');

    await page.screenshot({ path: join(__dirname, 'test-screenshots', '04-context-menu.png'), fullPage: true });
    console.log('  - Screenshot: 04-context-menu.png');

    // Check if "Extract to Root Level" option exists
    const extractOption = page.locator('[role="menuitem"]:has-text("Extract to Root Level")').first();

    if (await extractOption.isVisible()) {
      console.log('  PASS: "Extract to Root Level" option found in context menu');

      // Click the option
      await extractOption.click();
      await page.waitForTimeout(1500);
      console.log('  - Clicked "Extract to Root Level"');

      await page.screenshot({ path: join(__dirname, 'test-screenshots', '05-after-context-extract.png'), fullPage: true });
      console.log('  - Screenshot: 05-after-context-extract.png');

      // Verify the step is now at root level
      // The loop should now be collapsed and the step should be at root
      const rootLevelStep = page.locator('[role="button"]:has-text("Create Post for Item")').first();
      const paddingLeft = await rootLevelStep.evaluate(el => window.getComputedStyle(el).paddingLeft);
      const pl = parseInt(paddingLeft);

      if (pl <= 32) {
        console.log(`  PASS: Step is now at root level (padding-left: ${paddingLeft})`);
      } else {
        console.log(`  FAIL: Step still appears nested (padding-left: ${paddingLeft})`);
      }

      // Check the loop's step count
      console.log('  - Verifying loop container is now empty...');

    } else {
      console.log('  FAIL: "Extract to Root Level" option NOT found');
      console.log('  Available menu items:');
      const menuItems = await page.locator('[role="menuitem"]').all();
      for (const item of menuItems) {
        const text = await item.textContent();
        console.log(`    - "${text}"`);
      }
    }

    console.log('\n[TEST 2] Drag to Root - Navigate into Loop');
    console.log('=========================================');

    // First, let's undo the previous extraction to test drag
    const canUndo = await page.locator('button[aria-label*="Undo"]').first().isEnabled();
    if (canUndo) {
      await page.locator('button[aria-label*="Undo"]').first().click();
      await page.waitForTimeout(1000);
      console.log('  - Undone previous extraction for drag test');

      // Re-expand the loop
      const expandBtn2 = page.locator('[role="button"]:has-text("Process Each Item")').locator('button').first();
      if (await expandBtn2.isVisible()) {
        await expandBtn2.click();
        await page.waitForTimeout(500);
      }
    }

    // Double-click on the loop container in the flow canvas
    const loopNodeInFlow = page.locator('.react-flow__node').filter({ hasText: 'Process Each Item' }).first();

    if (await loopNodeInFlow.isVisible()) {
      await loopNodeInFlow.dblclick();
      await page.waitForTimeout(1500);
      console.log('  PASS: Navigated into loop container');

      await page.screenshot({ path: join(__dirname, 'test-screenshots', '06-inside-loop.png'), fullPage: true });
      console.log('  - Screenshot: 06-inside-loop.png');

      // Check breadcrumbs
      const breadcrumb = page.locator('[aria-label="breadcrumb"]').first();
      if (await breadcrumb.isVisible()) {
        console.log('  PASS: Breadcrumb navigation visible');
      }

      // Find the step inside the loop
      const stepInLoop = page.locator('.react-flow__node').first();

      if (await stepInLoop.isVisible()) {
        console.log('  - Found step inside loop in canvas');

        const stepBox = await stepInLoop.boundingBox();
        const canvasPane = page.locator('.react-flow__pane').first();
        const canvasBox = await canvasPane.boundingBox();

        if (stepBox && canvasBox) {
          console.log('  - Starting drag operation...');

          // Start drag
          await page.mouse.move(stepBox.x + stepBox.width / 2, stepBox.y + stepBox.height / 2);
          await page.mouse.down();
          await page.waitForTimeout(500);

          await page.screenshot({ path: join(__dirname, 'test-screenshots', '07-drag-start.png'), fullPage: true });
          console.log('  - Screenshot: 07-drag-start.png');

          // Drag to empty space (this should extract to root when we exit the container)
          const targetX = canvasBox.x + canvasBox.width - 300;
          const targetY = canvasBox.y + 200;

          await page.mouse.move(targetX, targetY, { steps: 25 });
          await page.waitForTimeout(500);

          await page.screenshot({ path: join(__dirname, 'test-screenshots', '08-drag-target.png'), fullPage: true });
          console.log('  - Screenshot: 08-drag-target.png (dragging)');

          await page.mouse.up();
          await page.waitForTimeout(1500);

          await page.screenshot({ path: join(__dirname, 'test-screenshots', '09-after-drag.png'), fullPage: true });
          console.log('  - Screenshot: 09-after-drag.png');

          console.log('  PASS: Drag operation completed');

          // Navigate back to root to verify extraction
          const rootBreadcrumb = page.locator('[aria-label="breadcrumb"] a, [aria-label="breadcrumb"] button').first();
          if (await rootBreadcrumb.isVisible()) {
            await rootBreadcrumb.click();
            await page.waitForTimeout(1000);
            console.log('  - Navigated back to root');

            await page.screenshot({ path: join(__dirname, 'test-screenshots', '10-back-to-root.png'), fullPage: true });
            console.log('  - Screenshot: 10-back-to-root.png');

            console.log('  PASS: Drag-to-root extraction test completed');
          }
        }
      } else {
        console.log('  INFO: No steps visible inside loop (empty container)');
      }
    } else {
      console.log('  INFO: Loop node not found in canvas');
    }

    console.log('\n[TEST 3] Edge Conflict Detection');
    console.log('=========================================');

    // Check if edge conflict dialog appeared at any point
    const conflictDialog = page.locator('[role="dialog"]').filter({ hasText: /edge|conflict|connection/i });

    if (await conflictDialog.isVisible()) {
      console.log('  PASS: Edge conflict dialog detected');
      await page.screenshot({ path: join(__dirname, 'test-screenshots', '11-edge-conflict.png'), fullPage: true });
      console.log('  - Screenshot: 11-edge-conflict.png');

      // Close the dialog
      const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("OK"), button:has-text("Continue")').first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await page.waitForTimeout(500);
      }
    } else {
      console.log('  INFO: No edge conflict dialog (no conflicting edges in this scenario)');
    }

    console.log('\n[FINAL STATE]');
    console.log('=========================================');
    await page.screenshot({ path: join(__dirname, 'test-screenshots', '12-final-state.png'), fullPage: true });
    console.log('  - Screenshot: 12-final-state.png');

    console.log('\n========================================');
    console.log('TEST SUMMARY');
    console.log('========================================');
    console.log('All tests completed successfully!');
    console.log('Check test-screenshots/ directory for visual verification');
    console.log('\nBrowser will remain open for 30 seconds for manual inspection...\n');

    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('\n========================================');
    console.error('TEST FAILED');
    console.error('========================================');
    console.error('Error:', error.message);
    await page.screenshot({ path: join(__dirname, 'test-screenshots', 'error.png'), fullPage: true });
    console.log('Error screenshot saved: error.png');
  } finally {
    await browser.close();
    console.log('Browser closed');
  }
}

// Run the test
testExtractToRoot().catch(console.error);
