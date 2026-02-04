/**
 * UI Investigation Script
 * Captures screenshots and analyzes layout issues
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, 'investigation-screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }

  console.log('='.repeat(80));
  console.log('UI ISSUES INVESTIGATION');
  console.log('='.repeat(80));

  try {
    // Step 1: Navigate to the app
    console.log('\n[1] Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Step 2: Capture initial state (Config mode)
    console.log('\n[2] Capturing initial state (Config mode)...');
    await page.screenshot({
      path: path.join(screenshotsDir, '1-config-mode-initial.png'),
      fullPage: true
    });

    // Step 3: Get layout information
    console.log('\n[3] Analyzing layout structure...');
    const layoutInfo = await page.evaluate(() => {
      const body = document.body;
      const html = document.documentElement;
      const root = document.getElementById('root');
      const header = document.querySelector('header');
      const main = document.querySelector('main');
      const reactFlow = document.querySelector('.react-flow');

      const getInfo = (element, name) => {
        if (!element) return { name, exists: false };
        const rect = element.getBoundingClientRect();
        const styles = window.getComputedStyle(element);
        return {
          name,
          exists: true,
          dimensions: {
            width: rect.width,
            height: rect.height,
            top: rect.top,
            left: rect.left,
          },
          styles: {
            display: styles.display,
            position: styles.position,
            overflow: styles.overflow,
            height: styles.height,
            maxWidth: styles.maxWidth,
            margin: styles.margin,
            padding: styles.padding,
          }
        };
      };

      return {
        window: { width: window.innerWidth, height: window.innerHeight },
        body: getInfo(body, 'body'),
        html: getInfo(html, 'html'),
        root: getInfo(root, '#root'),
        header: getInfo(header, 'header'),
        main: getInfo(main, 'main'),
        reactFlow: getInfo(reactFlow, '.react-flow'),
      };
    });

    console.log('\nLayout Information:');
    console.log(JSON.stringify(layoutInfo, null, 2));

    // Step 4: Check CSS issues in index.css and App.css
    console.log('\n[4] Checking CSS issues...');
    const cssIssues = await page.evaluate(() => {
      const root = document.getElementById('root');
      const body = document.body;

      const rootStyles = window.getComputedStyle(root);
      const bodyStyles = window.getComputedStyle(body);

      return {
        root: {
          maxWidth: rootStyles.maxWidth,
          margin: rootStyles.margin,
          padding: rootStyles.padding,
          textAlign: rootStyles.textAlign,
        },
        body: {
          display: bodyStyles.display,
          placeItems: bodyStyles.placeItems,
          margin: bodyStyles.margin,
          minHeight: bodyStyles.minHeight,
        }
      };
    });

    console.log('\nCSS Issues Found:');
    console.log(JSON.stringify(cssIssues, null, 2));

    // Step 5: Switch to Execution mode
    console.log('\n[5] Switching to Execution mode...');
    const executionButton = await page.locator('button:has-text("Execution")').first();
    if (await executionButton.isVisible()) {
      await executionButton.click();
      await page.waitForTimeout(1000);
    } else {
      console.log('Execution button not found, skipping...');
    }

    // Step 6: Capture Execution mode
    console.log('\n[6] Capturing Execution mode...');
    await page.screenshot({
      path: path.join(screenshotsDir, '2-execution-mode.png'),
      fullPage: true
    });

    // Step 7: Check React Flow position
    console.log('\n[7] Checking React Flow position...');
    const flowInfo = await page.evaluate(() => {
      const reactFlow = document.querySelector('.react-flow');
      const main = document.querySelector('main');
      const header = document.querySelector('header');

      if (!reactFlow) {
        return { error: 'React Flow container not found' };
      }

      const flowRect = reactFlow.getBoundingClientRect();
      const mainRect = main ? main.getBoundingClientRect() : null;
      const headerRect = header ? header.getBoundingClientRect() : null;

      const flowParent = reactFlow.parentElement;
      const flowParentStyles = flowParent ? window.getComputedStyle(flowParent) : null;

      return {
        reactFlow: {
          position: { top: flowRect.top, left: flowRect.left },
          dimensions: { width: flowRect.width, height: flowRect.height },
          zIndex: window.getComputedStyle(reactFlow).zIndex,
          parent: {
            tagName: flowParent?.tagName,
            className: flowParent?.className,
            styles: flowParentStyles ? {
              display: flowParentStyles.display,
              flexGrow: flowParentStyles.flexGrow,
              height: flowParentStyles.height,
              overflow: flowParentStyles.overflow,
            } : null
          }
        },
        main: mainRect ? {
          position: { top: mainRect.top, left: mainRect.left },
          dimensions: { width: mainRect.width, height: mainRect.height },
        } : null,
        header: headerRect ? {
          position: { top: headerRect.top, left: headerRect.left },
          dimensions: { width: headerRect.width, height: headerRect.height },
        } : null,
      };
    });

    console.log('\nReact Flow Position Analysis:');
    console.log(JSON.stringify(flowInfo, null, 2));

    // Step 8: Get console errors
    console.log('\n[8] Checking console errors...');
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('CONSOLE ERROR:', msg.text());
      }
    });

    // Step 9: Highlight problem areas
    console.log('\n[9] Highlighting problem areas...');
    await page.evaluate(() => {
      const root = document.getElementById('root');
      if (root) {
        root.style.outline = '3px solid red';
        root.style.outlineOffset = '-3px';
      }

      const reactFlow = document.querySelector('.react-flow');
      if (reactFlow) {
        reactFlow.style.outline = '3px solid blue';
        reactFlow.style.outlineOffset = '-3px';
      }

      const main = document.querySelector('main');
      if (main) {
        main.style.outline = '3px solid green';
        main.style.outlineOffset = '-3px';
      }
    });

    await page.screenshot({
      path: path.join(screenshotsDir, '3-highlighted-areas.png'),
      fullPage: true
    });

    console.log('\n' + '='.repeat(80));
    console.log('INVESTIGATION SUMMARY');
    console.log('='.repeat(80));
    console.log('\nISSUE 1: Layout not using full screen');
    console.log('---------------------------------------');

    if (layoutInfo.root.styles.maxWidth !== 'none' && layoutInfo.root.styles.maxWidth !== '100%') {
      console.log('[FOUND] #root has max-width:', layoutInfo.root.styles.maxWidth);
      console.log('  Location: src/App.css');
      console.log('  Problem: #root { max-width: 1280px } constrains the layout');
    }

    if (layoutInfo.root.styles.margin !== '0px') {
      console.log('[FOUND] #root has margin:', layoutInfo.root.styles.margin);
      console.log('  Location: src/App.css');
      console.log('  Problem: #root { margin: 0 auto } centers and constrains the layout');
    }

    if (layoutInfo.root.styles.padding !== '0px') {
      console.log('[FOUND] #root has padding:', layoutInfo.root.styles.padding);
      console.log('  Location: src/App.css');
      console.log('  Problem: #root { padding: 2rem } adds extra spacing');
    }

    if (layoutInfo.body.styles.display === 'flex') {
      console.log('[FOUND] body has display: flex with place-items:', layoutInfo.body.styles.placeItems);
      console.log('  Location: src/index.css');
      console.log('  Problem: body { display: flex; place-items: center } centers content');
    }

    console.log('\n\nISSUE 2: React Flow position');
    console.log('---------------------------------------');
    if (flowInfo.reactFlow) {
      console.log('React Flow found at:', flowInfo.reactFlow.position);
      console.log('React Flow dimensions:', flowInfo.reactFlow.dimensions);
      console.log('React Flow parent:', flowInfo.reactFlow.parent);

      if (flowInfo.header && flowInfo.reactFlow.position.top < flowInfo.header.dimensions.height) {
        console.log('[FOUND] React Flow overlaps with header!');
      }
    } else if (flowInfo.error) {
      console.log('[INFO]', flowInfo.error);
    }

    console.log('\n\nScreenshots saved to:', screenshotsDir);
    console.log('- 1-config-mode-initial.png');
    console.log('- 2-execution-mode.png');
    console.log('- 3-highlighted-areas.png');

  } catch (error) {
    console.error('\nError during investigation:', error);
  } finally {
    console.log('\n[DONE] Press Enter to close browser...');
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });
    await browser.close();
  }
})();
