import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Click EXECUTION button
  const executionButton = await page.locator('button:has-text("EXECUTION")').first();
  await executionButton.click();
  await page.waitForTimeout(3000);

  // Check for sidebar elements
  const sidebarInfo = await page.evaluate(() => {
    const results = {
      sidebars: [],
      mainContentChildren: [],
      allVisibleElements: []
    };

    // Look for elements that might be sidebars (before main content)
    const allDivs = document.querySelectorAll('div');
    for (const div of allDivs) {
      const rect = div.getBoundingClientRect();
      const style = window.getComputedStyle(div);

      // Look for elements that are on the left edge with fixed width
      if (rect.left === 0 && rect.top > 50 && rect.width > 100 && rect.width < 400) {
        results.sidebars.push({
          className: div.className,
          position: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
          display: style.display,
          visibility: style.visibility,
          opacity: style.opacity,
          textContent: div.textContent?.substring(0, 100)
        });
      }
    }

    // Get all direct children of main
    const main = document.querySelector('main');
    if (main) {
      const children = Array.from(main.children);
      results.mainContentChildren = children.map((child, index) => {
        const rect = child.getBoundingClientRect();
        const style = window.getComputedStyle(child);
        return {
          index,
          tagName: child.tagName,
          className: child.className,
          position: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
          display: style.display,
          flexGrow: style.flexGrow,
          flexShrink: style.flexShrink,
          flexBasis: style.flexBasis
        };
      });
    }

    // Get all elements with substantial width
    for (const el of allDivs) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 200 && rect.height > 200 && rect.top >= 64 && rect.top < 300) {
        const style = window.getComputedStyle(el);
        results.allVisibleElements.push({
          className: el.className,
          position: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
          display: style.display
        });
      }
    }

    return results;
  });

  console.log('\n=== POTENTIAL SIDEBAR ELEMENTS ===\n');
  console.log(JSON.stringify(sidebarInfo.sidebars, null, 2));

  console.log('\n=== MAIN CONTENT DIRECT CHILDREN ===\n');
  console.log(JSON.stringify(sidebarInfo.mainContentChildren, null, 2));

  console.log('\n=== LARGE VISIBLE ELEMENTS ===\n');
  console.log(JSON.stringify(sidebarInfo.allVisibleElements, null, 2));

  await browser.close();
})();
