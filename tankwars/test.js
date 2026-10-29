const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  let hasErrors = false;
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console Error:', msg.text());
      hasErrors = true;
    }
  });
  
  page.on('pageerror', err => {
    console.log('Page Error:', err.message);
    hasErrors = true;
  });
  
  try {
    await page.goto('file:///C:/DevOpenCode/tankwars/index.html');
    await page.waitForTimeout(2000);
    
    const title = await page.locator('#title').textContent();
    console.log('Title:', title);
    
    const canvas = await page.locator('#gameCanvas');
    const isVisible = await canvas.isVisible();
    console.log('Canvas visible:', isVisible);
    
    const levelBtns = await page.locator('.level-btn').count();
    console.log('Level buttons:', levelBtns);
    
    if (!hasErrors) {
      console.log('Game loaded successfully with no errors!');
    }
  } catch (err) {
    console.log('Test failed:', err.message);
    process.exit(1);
  }
  
  await browser.close();
  
  if (hasErrors) {
    process.exit(1);
  }
})();
