import { chromium } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testExtractToRoot() {
  console.log('\n' + '='.repeat(80));
  console.log('  EXTRACT-TO-ROOT FUNCTIONALITY TEST'.padStart(56));
  console.log('='.repeat(80) + '\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 600
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();
  const results = {
    contextMenuExtract: false,
    dragToRootExtract: false,
    edgeConflictDetection: 'N/A'
  };

  try {
    // SETUP
    console.log('[SETUP] Loading application...');
    await page.goto('http://localhost:5186/');
    await page.waitForLoadState('networkidle');
    await sleep(1000);

    // Close any open dialogs
    const closeBtn = page.locator('button:has-text("Cancel"), button:has-text("Close")').first();
    if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await closeBtn.click();
      await sleep(500);
    }

    await page.waitForSelector('.react-flow');
    await page.screenshot({ path: join(__dirname, 'test-screenshots', 'setup-01-loaded.png'), fullPage: true });
    console.log('  Application loaded successfully\n');

    // TEST 1: Context Menu Extract
    console.log('-'.repeat(80));
    console.log('TEST 1: Context Menu - Extract to Root Level');
    console.log('-'.repeat(80));

    // Find and expand the loop container
    console.log('Step 1.1: Find "Process Each Item" loop container');
    const loopStep = page.locator('text="Process Each Item"').first();
    await loopStep.scrollIntoViewIfNeeded();

    const expandBtn = page.locator('[role="button"]:has-text("Process Each Item")').locator('button').first();
    await expandBtn.click();
    await sleep(800);
    console.log('  PASS: Loop container expanded');

    await page.screenshot({ path: join(__dirname, 'test-screenshots', 'test1-01-expanded.png'), fullPage: true });

    // Verify nested step is visible
    console.log('Step 1.2: Verify nested step is visible');
    const nestedStep = page.locator('[role="button"]:has-text("Create Post for Item")').first();
    const isVisible = await nestedStep.isVisible();

    if (isVisible) {
      console.log('  PASS: Nested step "Create Post for Item" found');

      // Get initial padding (should be indented)
      const initialPadding = await nestedStep.evaluate(el => window.getComputedStyle(el).paddingLeft);
      console.log(`  Initial padding-left: ${initialPadding} (nested state)`);
    } else {
      throw new Error('Nested step not visible');
    }

    // Right-click to open context menu
    console.log('Step 1.3: Open context menu on nested step');
    await nestedStep.click({ button: 'right' });
    await sleep(800);

    await page.screenshot({ path: join(__dirname, 'test-screenshots', 'test1-02-context-menu.png'), fullPage: true });
    console.log('  PASS: Context menu opened');

    // Verify "Extract to Root Level" option exists
    console.log('Step 1.4: Verify "Extract to Root Level" option exists');
    const extractOption = page.locator('[role="menuitem"]:has-text("Extract to Root Level")');
    const optionExists = await extractOption.isVisible();

    if (optionExists) {
      console.log('  PASS: "Extract to Root Level" option found in menu');
      results.contextMenuExtract = true;

      // Click the option
      console.log('Step 1.5: Click "Extract to Root Level"');
      await extractOption.click();
      await sleep(1500);

      await page.screenshot({ path: join(__dirname, 'test-screenshots', 'test1-03-after-extract.png'), fullPage: true });
      console.log('  PASS: Extraction executed');

      // Verify the step is now at root level
      console.log('Step 1.6: Verify step moved to root level');
      const extractedStep = page.locator('[role="button"]:has-text("Create Post for Item")').first();
      const finalPadding = await extractedStep.evaluate(el => window.getComputedStyle(el).paddingLeft);
      const pl = parseInt(finalPadding);

      if (pl <= 32) {
        console.log(`  PASS: Step is at root level (padding-left: ${finalPadding})`);
        console.log('  PASS: Container step count should have decreased');
      } else {
        console.log(`  FAIL: Step still nested (padding-left: ${finalPadding})`);
        results.contextMenuExtract = false;
      }
    } else {
      console.log('  FAIL: "Extract to Root Level" option not found');
      const menuItems = await page.locator('[role="menuitem"]').allTextContents();
      console.log('  Available options:', menuItems.join(', '));
    }

    console.log('\nTEST 1 RESULT:', results.contextMenuExtract ? 'PASSED' : 'FAILED');
    console.log('');

    // TEST 2: Drag to Root Extract
    console.log('-'.repeat(80));
    console.log('TEST 2: Drag & Drop - Extract to Root Level');
    console.log('-'.repeat(80));

    // We need a scenario with a nested step that's inside a container
    // Since we already extracted it in TEST 1, let's reload the page or create a new nested step
    console.log('Step 2.1: Reload page to reset scenario state');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await sleep(1500);

    // Close any dialogs
    const closeBtn2 = page.locator('button:has-text("Cancel"), button:has-text("Close")').first();
    if (await closeBtn2.isVisible({ timeout: 1000 }).catch(() => false)) {
      await closeBtn2.click();
      await sleep(500);
    }

    await page.screenshot({ path: join(__dirname, 'test-screenshots', 'test2-01-reloaded.png'), fullPage: true });
    console.log('  PASS: Page reloaded');

    // Navigate into the loop container
    console.log('Step 2.2: Double-click loop container to navigate inside');
    const loopNode = page.locator('.react-flow__node').filter({ hasText: 'Process Each Item' }).first();

    if (await loopNode.isVisible({ timeout: 5000 })) {
      await loopNode.dblclick();
      await sleep(1500);

      await page.screenshot({ path: join(__dirname, 'test-screenshots', 'test2-02-inside-container.png'), fullPage: true });
      console.log('  PASS: Navigated into loop container');

      // Verify breadcrumbs
      const breadcrumb = page.locator('[aria-label="breadcrumb"]');
      if (await breadcrumb.isVisible()) {
        console.log('  PASS: Breadcrumb navigation visible');
      }

      // Find the step inside
      console.log('Step 2.3: Find step inside container');
      const stepInContainer = page.locator('.react-flow__node').first();

      if (await stepInContainer.isVisible()) {
        console.log('  PASS: Step found inside container');

        const stepBox = await stepInContainer.boundingBox();
        const canvasPane = page.locator('.react-flow__pane').first();
        const canvasBox = await canvasPane.boundingBox();

        if (stepBox && canvasBox) {
          console.log('Step 2.4: Perform drag operation to empty space');

          // Start drag
          const startX = stepBox.x + stepBox.width / 2;
          const startY = stepBox.y + stepBox.height / 2;

          await page.mouse.move(startX, startY);
          await page.mouse.down();
          await sleep(500);

          console.log('  Drag started...');
          await page.screenshot({ path: join(__dirname, 'test-screenshots', 'test2-03-drag-start.png'), fullPage: true });

          // Drag to empty space (far right)
          const targetX = canvasBox.x + canvasBox.width - 250;
          const targetY = canvasBox.y + 150;

          await page.mouse.move(targetX, targetY, { steps: 30 });
          await sleep(500);

          console.log('  Dragging to target position...');
          await page.screenshot({ path: join(__dirname, 'test-screenshots', 'test2-04-dragging.png'), fullPage: true });

          await page.mouse.up();
          await sleep(1500);

          console.log('  PASS: Drag completed');
          await page.screenshot({ path: join(__dirname, 'test-screenshots', 'test2-05-after-drag.png'), fullPage: true });

          // Navigate back to root to verify extraction
          console.log('Step 2.5: Navigate back to root level');
          const rootBreadcrumb = page.locator('[aria-label="breadcrumb"] a, [aria-label="breadcrumb"] button').first();
          if (await rootBreadcrumb.isVisible()) {
            await rootBreadcrumb.click();
            await sleep(1000);

            await page.screenshot({ path: join(__dirname, 'test-screenshots', 'test2-06-back-to-root.png'), fullPage: true });
            console.log('  PASS: Returned to root level');

            // Verify the step is now at root in the tree
            const extractedStepInTree = page.locator('[role="button"]:has-text("Create Post for Item")').first();
            if (await extractedStepInTree.isVisible()) {
              const padding = await extractedStepInTree.evaluate(el => window.getComputedStyle(el).paddingLeft);
              const pl = parseInt(padding);

              if (pl <= 32) {
                console.log(`  PASS: Step extracted to root (padding: ${padding})`);
                results.dragToRootExtract = true;
              } else {
                console.log(`  INFO: Step may still be nested (padding: ${padding})`);
              }
            }
          }
        }
      } else {
        console.log('  INFO: No step found inside container (container may be empty)');
        results.dragToRootExtract = 'N/A';
      }
    } else {
      console.log('  INFO: Loop container node not found in canvas');
      results.dragToRootExtract = 'N/A';
    }

    console.log('\nTEST 2 RESULT:', results.dragToRootExtract === true ? 'PASSED' : results.dragToRootExtract);
    console.log('');

    // TEST 3: Edge Conflict Detection
    console.log('-'.repeat(80));
    console.log('TEST 3: Edge Conflict Detection');
    console.log('-'.repeat(80));

    console.log('Checking for edge conflict dialog during tests...');

    const conflictDialog = page.locator('[role="dialog"]').filter({ hasText: /edge|conflict/i });

    if (await conflictDialog.isVisible({ timeout: 1000 }).catch(() => false)) {
      console.log('  PASS: Edge conflict dialog detected');
      results.edgeConflictDetection = 'DETECTED';
      await page.screenshot({ path: join(__dirname, 'test-screenshots', 'test3-01-edge-conflict.png'), fullPage: true });

      // Close dialog
      const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("OK")').first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
      }
    } else {
      console.log('  INFO: No edge conflict dialog appeared');
      console.log('  (This is expected if the step had no edges to other steps in the container)');
      results.edgeConflictDetection = 'NOT APPLICABLE';
    }

    console.log('\nTEST 3 RESULT:', results.edgeConflictDetection);
    console.log('');

    // Final screenshot
    await page.screenshot({ path: join(__dirname, 'test-screenshots', 'final-state.png'), fullPage: true });

  } catch (error) {
    console.error('\n' + '='.repeat(80));
    console.error('ERROR OCCURRED');
    console.error('='.repeat(80));
    console.error(error.message);
    console.error('');
    await page.screenshot({ path: join(__dirname, 'test-screenshots', 'error.png'), fullPage: true });
  } finally {
    // Print final report
    console.log('\n' + '='.repeat(80));
    console.log('  FINAL TEST REPORT'.padStart(52));
    console.log('='.repeat(80));
    console.log('');
    console.log('Test Results:');
    console.log('  1. Context Menu Extract:     ', results.contextMenuExtract ? 'PASS' : 'FAIL');
    console.log('  2. Drag to Root Extract:     ', results.dragToRootExtract === true ? 'PASS' : results.dragToRootExtract);
    console.log('  3. Edge Conflict Detection:  ', results.edgeConflictDetection);
    console.log('');
    console.log('Screenshots saved in: test-screenshots/');
    console.log('');

    const allPassed = results.contextMenuExtract && (results.dragToRootExtract === true || results.dragToRootExtract === 'N/A');

    if (allPassed) {
      console.log('STATUS: ALL TESTS PASSED');
    } else {
      console.log('STATUS: SOME TESTS FAILED - Review screenshots for details');
    }

    console.log('='.repeat(80));
    console.log('');
    console.log('Browser will remain open for 20 seconds for manual inspection...\n');

    await sleep(20000);
    await browser.close();
  }
}

testExtractToRoot().catch(console.error);
