import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('=== E2E Test Report ===\n');
  console.log('URL: http://localhost:5173\n');

  // Step 1: Navigate to the page
  console.log('Step 1: Navigating to application...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Take screenshot of Config mode
  console.log('Step 2: Taking screenshot of Config mode...');
  await page.screenshot({ path: '/tmp/config-mode.png', fullPage: true });
  console.log('  Screenshot saved: /tmp/config-mode.png');

  // Step 3: Click EXECUTION button
  console.log('\nStep 3: Looking for EXECUTION button...');

  // Wait for the button and click it
  const executionButton = await page.locator('button:has-text("EXECUTION")').first();
  await executionButton.waitFor({ state: 'visible', timeout: 5000 });
  console.log('  Found EXECUTION button, clicking...');
  await executionButton.click();
  await page.waitForTimeout(2000);

  // Step 4: Take full page screenshot of Execution mode
  console.log('\nStep 4: Taking FULL PAGE screenshot of Execution mode...');
  await page.screenshot({ path: '/tmp/execution-mode.png', fullPage: true });
  console.log('  Screenshot saved: /tmp/execution-mode.png');

  // Step 5: Execute JavaScript to find React Flow position
  console.log('\nStep 5: Analyzing React Flow position...');
  const analysis = await page.evaluate(() => {
    const results = {
      flows: [],
      header: null,
      headerContainsFlow: false,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };

    // Find all react-flow elements
    const flows = document.querySelectorAll('.react-flow');
    flows.forEach((flow, i) => {
      const rect = flow.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(flow);
      results.flows.push({
        index: i,
        position: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          right: rect.right,
          bottom: rect.bottom
        },
        parent: {
          className: flow.parentElement?.className || 'none',
          tagName: flow.parentElement?.tagName || 'none'
        },
        grandparent: {
          className: flow.parentElement?.parentElement?.className || 'none',
          tagName: flow.parentElement?.parentElement?.tagName || 'none'
        },
        styles: {
          position: computedStyle.position,
          zIndex: computedStyle.zIndex,
          display: computedStyle.display
        }
      });
    });

    // Find the header/navbar
    const header = document.querySelector('header');
    if (header) {
      const rect = header.getBoundingClientRect();
      results.header = {
        position: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          right: rect.right,
          bottom: rect.bottom
        },
        className: header.className
      };

      // Check if React Flow is inside the header
      results.headerContainsFlow = !!header.querySelector('.react-flow');
    }

    return results;
  });

  console.log('\n=== ANALYSIS RESULTS ===\n');
  console.log('Viewport:', analysis.viewport);
  console.log('\nHeader:', analysis.header);
  console.log('\nReact Flow Elements Found:', analysis.flows.length);

  analysis.flows.forEach((flow, i) => {
    console.log(`\nReact Flow ${i}:`);
    console.log(`  Position: top=${flow.position.top}px, left=${flow.position.left}px`);
    console.log(`  Size: width=${flow.position.width}px, height=${flow.position.height}px`);
    console.log(`  Bounds: right=${flow.position.right}px, bottom=${flow.position.bottom}px`);
    console.log(`  Parent: ${flow.parent.tagName}.${flow.parent.className}`);
    console.log(`  Grandparent: ${flow.grandparent.tagName}.${flow.grandparent.className}`);
    console.log(`  Styles: position=${flow.styles.position}, zIndex=${flow.styles.zIndex}, display=${flow.styles.display}`);
  });

  console.log('\nIs React Flow inside header?', analysis.headerContainsFlow);

  // Step 6: Highlight React Flow in screenshot
  console.log('\nStep 6: Taking annotated screenshot...');
  await page.evaluate(() => {
    const flows = document.querySelectorAll('.react-flow');
    flows.forEach(flow => {
      flow.style.outline = '5px solid red';
      flow.style.outlineOffset = '0px';

      // Add a label
      const label = document.createElement('div');
      label.textContent = 'REACT FLOW IS HERE';
      label.style.cssText = `
        position: absolute;
        top: 10px;
        left: 10px;
        background: red;
        color: white;
        padding: 10px 20px;
        font-size: 20px;
        font-weight: bold;
        z-index: 9999;
        pointer-events: none;
      `;
      flow.style.position = 'relative';
      flow.appendChild(label);
    });
  });

  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/execution-mode-annotated.png', fullPage: true });
  console.log('  Annotated screenshot saved: /tmp/execution-mode-annotated.png');

  console.log('\n=== TEST COMPLETE ===');
  console.log('\nScreenshots saved to:');
  console.log('  1. /tmp/config-mode.png');
  console.log('  2. /tmp/execution-mode.png');
  console.log('  3. /tmp/execution-mode-annotated.png (with red outline)');

  await browser.close();
})();
