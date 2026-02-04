/**
 * Quick UI Investigation Script
 */

import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

  // Analyze layout
  const analysis = await page.evaluate(() => {
    const root = document.getElementById('root');
    const body = document.body;
    const main = document.querySelector('main');
    const reactFlow = document.querySelector('.react-flow');

    const getStyles = (el) => {
      if (!el) return null;
      const s = window.getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        rect: { width: r.width, height: r.height, top: r.top, left: r.left },
        display: s.display,
        position: s.position,
        maxWidth: s.maxWidth,
        margin: s.margin,
        padding: s.padding,
        height: s.height,
        overflow: s.overflow,
      };
    };

    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      root: getStyles(root),
      body: getStyles(body),
      main: getStyles(main),
      reactFlow: getStyles(reactFlow),
    };
  });

  console.log('\n=== LAYOUT ANALYSIS ===\n');
  console.log('Viewport:', analysis.viewport);
  console.log('\n#root:', analysis.root);
  console.log('\nbody:', analysis.body);
  console.log('\nmain:', analysis.main);
  console.log('\n.react-flow:', analysis.reactFlow);

  // Take screenshots
  console.log('\nTaking screenshots...');
  await page.screenshot({ path: 'investigation-screenshots/config-mode.png', fullPage: true });

  // Switch to execution mode if possible
  try {
    await page.click('button:has-text("Execution")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'investigation-screenshots/execution-mode.png', fullPage: true });
  } catch (e) {
    console.log('Could not switch to execution mode');
  }

  await browser.close();
  console.log('\nDone!');
})();
