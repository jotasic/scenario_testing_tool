import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Click EXECUTION button
  const executionButton = await page.locator('button:has-text("EXECUTION")').first();
  await executionButton.click();
  await page.waitForTimeout(2000);

  // Find ALL elements with "flow" in their class name
  const flowElements = await page.evaluate(() => {
    const results = [];

    // Find all elements
    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
      const className = el.className;
      if (typeof className === 'string' && className.toLowerCase().includes('flow')) {
        const rect = el.getBoundingClientRect();
        results.push({
          tagName: el.tagName,
          className: className,
          id: el.id,
          position: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          }
        });
      }
    }

    return results;
  });

  console.log('\n=== ALL ELEMENTS WITH "flow" IN CLASS NAME ===\n');
  flowElements.forEach((el, i) => {
    console.log(`${i + 1}. ${el.tagName}.${el.className.substring(0, 80)}`);
    console.log(`   Position: left=${el.position.left}px, width=${el.position.width}px, height=${el.position.height}px`);
    console.log('');
  });

  // Check what's actually visible on screen
  const visibleContent = await page.evaluate(() => {
    const mainContent = document.querySelector('main');
    if (!mainContent) return 'No main element found';

    const children = Array.from(mainContent.children);
    return children.map(child => {
      const rect = child.getBoundingClientRect();
      const style = window.getComputedStyle(child);
      return {
        tagName: child.tagName,
        className: child.className,
        position: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
        display: style.display,
        flexGrow: style.flexGrow,
        children: Array.from(child.children).map(grandchild => ({
          tagName: grandchild.tagName,
          className: grandchild.className,
          rect: grandchild.getBoundingClientRect()
        }))
      };
    });
  });

  console.log('\n=== MAIN CONTENT CHILDREN ===\n');
  console.log(JSON.stringify(visibleContent, null, 2));

  await browser.close();
})();
