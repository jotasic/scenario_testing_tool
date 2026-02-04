/**
 * Detailed UI Investigation Script
 */

import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

  // Switch to execution mode
  await page.click('button:has-text("Execution")');
  await page.waitForTimeout(1000);

  // Analyze React Flow container
  const reactFlowAnalysis = await page.evaluate(() => {
    const reactFlow = document.querySelector('.react-flow');
    const reactFlowWrapper = document.querySelector('.react-flow__renderer');
    const allDivs = document.querySelectorAll('div');

    let flowContainer = null;
    allDivs.forEach(div => {
      if (div.style.width === '100%' && div.style.height === '100%') {
        const parent = div.parentElement;
        if (parent && parent.classList.toString().includes('MuiBox')) {
          flowContainer = div;
        }
      }
    });

    const getFullInfo = (el, name) => {
      if (!el) return { name, exists: false };
      const rect = el.getBoundingClientRect();
      const styles = window.getComputedStyle(el);
      const parent = el.parentElement;
      const parentRect = parent ? parent.getBoundingClientRect() : null;
      const parentStyles = parent ? window.getComputedStyle(parent) : null;

      return {
        name,
        exists: true,
        rect: {
          width: rect.width,
          height: rect.height,
          top: rect.top,
          left: rect.left
        },
        styles: {
          display: styles.display,
          position: styles.position,
          width: styles.width,
          height: styles.height,
          flexGrow: styles.flexGrow,
          overflow: styles.overflow,
          zIndex: styles.zIndex,
        },
        parent: parent ? {
          tagName: parent.tagName,
          className: parent.className,
          rect: {
            width: parentRect.width,
            height: parentRect.height,
            top: parentRect.top,
            left: parentRect.left,
          },
          styles: {
            display: parentStyles.display,
            flexGrow: parentStyles.flexGrow,
            height: parentStyles.height,
            overflow: parentStyles.overflow,
          }
        } : null
      };
    };

    return {
      reactFlow: getFullInfo(reactFlow, '.react-flow'),
      reactFlowWrapper: getFullInfo(reactFlowWrapper, '.react-flow__renderer'),
      flowContainer: getFullInfo(flowContainer, 'flow container div'),
    };
  });

  console.log('\n=== REACT FLOW ANALYSIS ===\n');
  console.log(JSON.stringify(reactFlowAnalysis, null, 2));

  // Get the hierarchy
  const hierarchy = await page.evaluate(() => {
    const reactFlow = document.querySelector('.react-flow');
    if (!reactFlow) return 'React Flow not found';

    let result = '';
    let current = reactFlow;
    let depth = 0;

    while (current && depth < 10) {
      const rect = current.getBoundingClientRect();
      const styles = window.getComputedStyle(current);
      const indent = '  '.repeat(depth);

      result += `${indent}${current.tagName} .${current.className.split(' ')[0] || 'no-class'}\n`;
      result += `${indent}  rect: ${rect.width}x${rect.height} at (${rect.left}, ${rect.top})\n`;
      result += `${indent}  display: ${styles.display}, flexGrow: ${styles.flexGrow}, height: ${styles.height}\n`;
      result += `${indent}  overflow: ${styles.overflow}, position: ${styles.position}\n\n`;

      current = current.parentElement;
      depth++;
    }

    return result;
  });

  console.log('\n=== REACT FLOW HIERARCHY ===\n');
  console.log(hierarchy);

  await browser.close();
})();
