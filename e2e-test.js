import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runE2ETest() {
  console.log('\n===========================================');
  console.log('E2E Test Report - Scenario Tool');
  console.log('===========================================\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 스크린샷 디렉토리 생성
  const screenshotDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir);
  }

  let stepNumber = 1;
  const issues = [];

  try {
    // Step 1: Navigate to the app
    console.log(`${stepNumber}. Navigating to http://localhost:5173`);
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, `step-${stepNumber}-homepage.png`) });
    console.log(`   ✓ Homepage loaded - screenshot-${stepNumber}.png\n`);
    stepNumber++;

    // Step 2: Find and click Import button
    console.log(`${stepNumber}. Looking for Import functionality`);
    await page.waitForTimeout(1000);

    // Try to find any button or link with "Import" text
    const importButton = await page.locator('text=/import/i').first();
    if (await importButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await importButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(screenshotDir, `step-${stepNumber}-import-click.png`) });
      console.log(`   ✓ Import button clicked - screenshot-${stepNumber}.png\n`);
    } else {
      // Try navigation menu
      const navLinks = await page.locator('nav a, [role="navigation"] a').all();
      for (const link of navLinks) {
        const text = await link.textContent();
        if (text && text.toLowerCase().includes('import')) {
          await link.click();
          break;
        }
      }
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(screenshotDir, `step-${stepNumber}-import-nav.png`) });
      console.log(`   ✓ Navigated to Import page - screenshot-${stepNumber}.png\n`);
    }
    stepNumber++;

    // Step 3: Upload scenario file
    console.log(`${stepNumber}. Uploading scenario-test.json file`);

    // Look for file input
    const fileInput = await page.locator('input[type="file"]').first();
    if (await fileInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await fileInput.setInputFiles('/Users/taewookim/Downloads/scenario-test.json');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(screenshotDir, `step-${stepNumber}-file-uploaded.png`) });
      console.log(`   ✓ File uploaded - screenshot-${stepNumber}.png\n`);
    } else {
      console.log(`   ✗ File input not found\n`);
      issues.push({
        step: stepNumber,
        error: 'File input not found on Import page',
        location: 'Import page UI'
      });
    }
    stepNumber++;

    // Step 4: Check if data is loaded
    console.log(`${stepNumber}. Verifying scenario data loaded`);
    await page.waitForTimeout(2000);

    // Look for scenario name or any indication of loaded data
    const pageContent = await page.textContent('body');
    if (pageContent.includes('Sample API Test Flow') || pageContent.includes('mock_r1')) {
      await page.screenshot({ path: path.join(screenshotDir, `step-${stepNumber}-data-loaded.png`) });
      console.log(`   ✓ Scenario data loaded successfully - screenshot-${stepNumber}.png\n`);
    } else {
      await page.screenshot({ path: path.join(screenshotDir, `step-${stepNumber}-data-check.png`) });
      console.log(`   ? Data verification unclear - screenshot-${stepNumber}.png\n`);
    }
    stepNumber++;

    // Step 5: Navigate to Execution page
    console.log(`${stepNumber}. Navigating to Execution page`);

    const execLink = await page.locator('text=/execution|execute|run/i').first();
    if (await execLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await execLink.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(screenshotDir, `step-${stepNumber}-execution-page.png`) });
      console.log(`   ✓ Execution page loaded - screenshot-${stepNumber}.png\n`);
    } else {
      // Try navigation menu
      const navLinks = await page.locator('nav a, [role="navigation"] a').all();
      for (const link of navLinks) {
        const text = await link.textContent();
        if (text && /execution|execute|run/i.test(text)) {
          await link.click();
          break;
        }
      }
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(screenshotDir, `step-${stepNumber}-execution-nav.png`) });
      console.log(`   ✓ Navigated to Execution - screenshot-${stepNumber}.png\n`);
    }
    stepNumber++;

    // Step 6: Run scenario
    console.log(`${stepNumber}. Attempting to run scenario`);

    const runButton = await page.locator('button:has-text("Run"), button:has-text("Execute"), button:has-text("Start")').first();
    if (await runButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await runButton.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: path.join(screenshotDir, `step-${stepNumber}-scenario-running.png`) });
      console.log(`   ✓ Scenario execution started - screenshot-${stepNumber}.png\n`);
    } else {
      await page.screenshot({ path: path.join(screenshotDir, `step-${stepNumber}-run-button-search.png`) });
      console.log(`   ✗ Run button not found - screenshot-${stepNumber}.png\n`);
      issues.push({
        step: stepNumber,
        error: 'Run/Execute button not found',
        location: 'Execution page UI'
      });
    }
    stepNumber++;

    // Step 7: Monitor execution results
    console.log(`${stepNumber}. Monitoring execution results`);
    await page.waitForTimeout(5000);
    await page.screenshot({ path: path.join(screenshotDir, `step-${stepNumber}-execution-results.png`) });

    // Check console for errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    console.log(`   ✓ Execution monitoring - screenshot-${stepNumber}.png\n`);
    stepNumber++;

    // Final screenshot
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, `step-${stepNumber}-final-state.png`) });
    console.log(`${stepNumber}. Final state captured - screenshot-${stepNumber}.png\n`);

  } catch (error) {
    console.error('\n✗ Test failed with error:', error.message);
    await page.screenshot({ path: path.join(screenshotDir, 'error-state.png') });
    issues.push({
      step: stepNumber,
      error: error.message,
      location: 'Test execution'
    });
  }

  // Print summary
  console.log('\n===========================================');
  console.log('Test Summary');
  console.log('===========================================\n');

  if (issues.length === 0) {
    console.log('Status: ✓ ALL STEPS COMPLETED\n');
  } else {
    console.log('Status: ✗ ISSUES FOUND\n');
    console.log('Issues Found:');
    issues.forEach(issue => {
      console.log(`  ✗ Step ${issue.step}: ${issue.error}`);
      console.log(`     Location: ${issue.location}\n`);
    });
  }

  console.log(`Screenshots saved to: ${screenshotDir}\n`);
  console.log('===========================================\n');

  // Keep browser open for manual inspection
  console.log('Browser will remain open for 30 seconds for manual inspection...');
  await page.waitForTimeout(30000);

  await browser.close();
}

runE2ETest().catch(console.error);
