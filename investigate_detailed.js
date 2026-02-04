import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('\n=== DETAILED POSITION INVESTIGATION ===\n');

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Click EXECUTION button
  const executionButton = await page.locator('button:has-text("EXECUTION")').first();
  await executionButton.waitFor({ state: 'visible', timeout: 5000 });
  await executionButton.click();
  await page.waitForTimeout(2000);

  // Detailed analysis
  const analysis = await page.evaluate(() => {
    const results = {
      reactFlow: null,
      leftBox: null,
      rightBox: null,
      mainContent: null,
      parents: []
    };

    // Find React Flow
    const reactFlowElement = document.querySelector('.react-flow');
    if (reactFlowElement) {
      const rect = reactFlowElement.getBoundingClientRect();
      const style = window.getComputedStyle(reactFlowElement);
      results.reactFlow = {
        position: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
        computed: {
          width: style.width,
          height: style.height,
          flexGrow: style.flexGrow,
          flexShrink: style.flexShrink,
          flexBasis: style.flexBasis,
          display: style.display,
        }
      };

      // Trace parent hierarchy
      let current = reactFlowElement.parentElement;
      let level = 0;
      while (current && level < 10) {
        const rect = current.getBoundingClientRect();
        const style = window.getComputedStyle(current);
        results.parents.push({
          level,
          tagName: current.tagName,
          className: current.className,
          position: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
          computed: {
            width: style.width,
            height: style.height,
            flexGrow: style.flexGrow,
            flexShrink: style.flexShrink,
            flexBasis: style.flexBasis,
            display: style.display,
            flexDirection: style.flexDirection,
            overflow: style.overflow,
          }
        });
        current = current.parentElement;
        level++;
      }
    }

    // Find the "Left Box" (should contain ReactFlow)
    const leftBoxCandidates = document.querySelectorAll('[class*="css-"]');
    for (const el of leftBoxCandidates) {
      if (el.contains(reactFlowElement)) {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        if (style.flexGrow && style.flexGrow !== '0') {
          results.leftBox = {
            className: el.className,
            position: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
            computed: {
              width: style.width,
              height: style.height,
              flexGrow: style.flexGrow,
              flexShrink: style.flexShrink,
              flexBasis: style.flexBasis,
              display: style.display,
            }
          };
          break;
        }
      }
    }

    // Find the right panel (width: 400)
    const rightPanels = document.querySelectorAll('[class*="css-"]');
    for (const el of rightPanels) {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      if (style.width === '400px' && rect.height > 200) {
        results.rightBox = {
          className: el.className,
          position: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
          computed: {
            width: style.width,
            height: style.height,
            flexGrow: style.flexGrow,
            flexShrink: style.flexShrink,
            flexBasis: style.flexBasis,
          }
        };
        break;
      }
    }

    // Find main content (flex container)
    const mainContent = document.querySelector('main');
    if (mainContent) {
      const rect = mainContent.getBoundingClientRect();
      const style = window.getComputedStyle(mainContent);
      results.mainContent = {
        position: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
        computed: {
          display: style.display,
          flexGrow: style.flexGrow,
          overflow: style.overflow,
        }
      };
    }

    return results;
  });

  console.log('\n1. REACT FLOW ELEMENT:');
  console.log(JSON.stringify(analysis.reactFlow, null, 2));

  console.log('\n2. LEFT BOX (should contain React Flow):');
  console.log(JSON.stringify(analysis.leftBox, null, 2));

  console.log('\n3. RIGHT PANEL (Parameters/Result/Logs):');
  console.log(JSON.stringify(analysis.rightBox, null, 2));

  console.log('\n4. MAIN CONTENT:');
  console.log(JSON.stringify(analysis.mainContent, null, 2));

  console.log('\n5. PARENT HIERARCHY (from React Flow upward):');
  analysis.parents.forEach((parent, i) => {
    console.log(`\nLevel ${parent.level}: ${parent.tagName}.${parent.className.substring(0, 50)}...`);
    console.log(`  Position: left=${parent.position.left}px, width=${parent.position.width}px`);
    console.log(`  Computed width: ${parent.computed.width}`);
    console.log(`  Flex: grow=${parent.computed.flexGrow}, shrink=${parent.computed.flexShrink}, basis=${parent.computed.flexBasis}`);
    console.log(`  Display: ${parent.computed.display}, Direction: ${parent.computed.flexDirection}`);
  });

  console.log('\n\n=== DIAGNOSIS ===');
  if (analysis.leftBox && analysis.leftBox.position.width < 200) {
    console.log('ERROR: Left box containing React Flow is TOO NARROW!');
    console.log(`  Expected: Should take remaining space after right panel (viewport - 400px)`);
    console.log(`  Actual: ${analysis.leftBox.position.width}px`);
    console.log(`  flexGrow: ${analysis.leftBox.computed.flexGrow}`);
  }

  if (analysis.reactFlow && analysis.reactFlow.position.width < 200) {
    console.log('\nERROR: React Flow itself is TOO NARROW!');
    console.log(`  Width: ${analysis.reactFlow.position.width}px`);
    console.log(`  Computed width: ${analysis.reactFlow.computed.width}`);
  }

  await browser.close();
})();
