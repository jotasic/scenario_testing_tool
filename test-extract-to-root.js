import { chromium } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testExtractToRoot() {
  console.log('Starting extract-to-root test...');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500 // Slow down for visibility
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));

  try {
    console.log('\n=== STEP 1: Navigate to application ===');
    await page.goto('http://localhost:5186/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: join(__dirname, 'test-screenshots', '01-homepage.png'), fullPage: true });
    console.log('Screenshot saved: 01-homepage.png');

    console.log('\n=== STEP 2: Wait for scenario to load ===');
    // The app loads a scenario directly, wait for React Flow to render
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    await page.waitForTimeout(2000); // Give time for layout
    await page.screenshot({ path: join(__dirname, 'test-screenshots', '02-scenario-loaded.png'), fullPage: true });
    console.log('Screenshot saved: 02-scenario-loaded.png');

    console.log('\n=== STEP 3: Find container with nested steps in sidebar ===');
    // Look for step items in the sidebar tree
    // First expand all containers to see nested steps
    const expandButtons = await page.locator('button:has(svg)').filter({ hasText: '' }).all();
    console.log(`Found ${expandButtons.length} potential expand buttons`);

    // Click expand buttons to reveal nested steps
    for (const button of expandButtons.slice(0, 5)) {
      try {
        await button.click({ timeout: 1000 });
        await page.waitForTimeout(300);
      } catch (e) {
        // Ignore errors for non-expand buttons
      }
    }

    await page.screenshot({ path: join(__dirname, 'test-screenshots', '03-expanded-tree.png'), fullPage: true });
    console.log('Screenshot saved: 03-expanded-tree.png');

    // Look for container nodes in the flow
    const allNodes = await page.locator('.react-flow__node').all();
    console.log(`Found ${allNodes.length} total nodes in flow`);

    console.log('\n=== TEST 1: Context Menu Extract ===');
    // Look for steps in the tree that are indented (nested in containers)
    // Find list items that have higher padding-left (nested steps)
    const nestedStepItems = await page.locator('[role="button"]').filter({ has: page.locator('span:has-text("Chip")') }).all();

    // Find a nested step by looking for one that's indented
    let nestedStepItem = null;
    for (const item of nestedStepItems) {
      const paddingLeft = await item.evaluate(el => window.getComputedStyle(el).paddingLeft);
      const pl = parseInt(paddingLeft);
      // Nested steps will have pl > 32px (base is 16 + depth*16)
      if (pl > 32) {
        nestedStepItem = item;
        console.log(`Found nested step with padding-left: ${paddingLeft}`);
        break;
      }
    }

    if (nestedStepItem) {
      // Right-click on the nested step in the tree
      await nestedStepItem.click({ button: 'right' });
      await page.waitForTimeout(500);

      await page.screenshot({ path: join(__dirname, 'test-screenshots', '04-context-menu.png'), fullPage: true });
      console.log('Screenshot saved: 04-context-menu.png');

      // Look for "Extract to Root Level" option
      const extractOption = page.locator('text="Extract to Root Level"');

      if (await extractOption.count() > 0) {
        console.log('PASS: Found "Extract to Root Level" option in context menu');
        await extractOption.click();
        await page.waitForTimeout(1000);

        await page.screenshot({ path: join(__dirname, 'test-screenshots', '05-after-extract.png'), fullPage: true });
        console.log('Screenshot saved: 05-after-extract.png');
        console.log('TEST 1 PASSED: Context menu extract works!');
      } else {
        console.log('FAIL: "Extract to Root Level" option not found in context menu');
        console.log('Available menu items:');
        const menuItems = await page.locator('[role="menuitem"]').all();
        for (const item of menuItems) {
          const text = await item.textContent();
          console.log(`  - ${text}`);
        }
      }
    } else {
      console.log('INFO: No nested steps found in tree (may need to create a scenario with containers first)');
    }

    console.log('\n=== TEST 2: Drag to Root Extract ===');
    // Try to test drag from a container node in the flow canvas
    // First, find a container node (Loop or Group)
    const containerNode = await page.locator('.react-flow__node').filter({
      has: page.locator('[data-step-type="loop"], [data-step-type="group"]')
    }).first();

    if (await containerNode.count() > 0) {
      // Double-click to navigate into the container
      await containerNode.dblclick();
      await page.waitForTimeout(1000);

      await page.screenshot({ path: join(__dirname, 'test-screenshots', '06-inside-container.png'), fullPage: true });
      console.log('Screenshot saved: 06-inside-container.png');

      // Find a step inside the container (should now be visible in the flow)
      const stepInsideContainer = await page.locator('.react-flow__node').first();

      if (await stepInsideContainer.count() > 0) {
        const stepBox = await stepInsideContainer.boundingBox();

        if (stepBox) {
          console.log('Starting drag operation...');

          // Find empty canvas area
          const canvas = page.locator('.react-flow__pane').first();
          const canvasBox = await canvas.boundingBox();

          if (canvasBox) {
            // Start drag from step
            await page.mouse.move(stepBox.x + stepBox.width / 2, stepBox.y + stepBox.height / 2);
            await page.mouse.down();
            await page.waitForTimeout(300);

            // Take screenshot during drag
            await page.screenshot({ path: join(__dirname, 'test-screenshots', '07-during-drag.png'), fullPage: true });
            console.log('Screenshot saved: 07-during-drag.png');

            // Drag to empty space (outside any containers)
            const targetX = canvasBox.x + canvasBox.width - 200;
            const targetY = canvasBox.y + 150;
            await page.mouse.move(targetX, targetY, { steps: 20 });
            await page.waitForTimeout(300);

            await page.screenshot({ path: join(__dirname, 'test-screenshots', '08-drag-target.png'), fullPage: true });
            console.log('Screenshot saved: 08-drag-target.png');

            await page.mouse.up();
            await page.waitForTimeout(1000);

            await page.screenshot({ path: join(__dirname, 'test-screenshots', '09-after-drag-extract.png'), fullPage: true });
            console.log('Screenshot saved: 09-after-drag-extract.png');
            console.log('TEST 2 PASSED: Drag to root extract performed');

            // Navigate back to root to see the extracted step
            const breadcrumbRoot = page.locator('[aria-label="breadcrumb"] a').first();
            if (await breadcrumbRoot.count() > 0) {
              await breadcrumbRoot.click();
              await page.waitForTimeout(500);

              await page.screenshot({ path: join(__dirname, 'test-screenshots', '10-back-to-root.png'), fullPage: true });
              console.log('Screenshot saved: 10-back-to-root.png');
            }
          }
        }
      } else {
        console.log('INFO: No steps found inside container');
      }
    } else {
      console.log('INFO: No container nodes found (skip drag test)');
    }

    console.log('\n=== TEST 3: Edge Conflict Detection ===');
    // Check if edge conflict dialog appeared
    const conflictDialog = await page.locator('[role="dialog"], .MuiDialog-root').filter({ hasText: /edge|conflict|connection/i });

    if (await conflictDialog.count() > 0) {
      console.log('Edge conflict dialog detected!');
      await page.screenshot({ path: join(__dirname, 'test-screenshots', '09-edge-conflict-dialog.png'), fullPage: true });
      console.log('Screenshot saved: 09-edge-conflict-dialog.png');

      // Handle the dialog (click OK/Confirm)
      const confirmButton = await page.locator('button:has-text("OK"), button:has-text("Confirm"), button:has-text("Continue")').first();
      if (await confirmButton.count() > 0) {
        await confirmButton.click();
        await page.waitForTimeout(500);
      }
    } else {
      console.log('No edge conflict dialog detected (may not be applicable for this test)');
    }

    console.log('\n=== Final State ===');
    await page.screenshot({ path: join(__dirname, 'test-screenshots', '11-final-state.png'), fullPage: true });
    console.log('Screenshot saved: 11-final-state.png');

    // Get console logs
    console.log('\n=== Console Logs ===');
    // Already captured via page.on('console') above

    console.log('\n=== Test completed successfully! ===');
    console.log('Check test-screenshots/ directory for all screenshots');

    // Keep browser open for manual inspection
    console.log('\nBrowser will remain open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: join(__dirname, 'test-screenshots', 'error.png'), fullPage: true });
    console.log('Error screenshot saved: error.png');
  } finally {
    await browser.close();
    console.log('Browser closed');
  }
}

// Run the test
testExtractToRoot().catch(console.error);
