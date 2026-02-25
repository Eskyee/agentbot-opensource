const fs = require('fs');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ 
    viewport: { width: 1280, height: 430 } 
  });
  
  const html = fs.readFileSync('./agentbot-banner.html', 'utf8');
  await page.setContent(html);
  
  await page.screenshot({ 
    path: './agentbot-banner.png',
    type: 'png'
  });
  
  await browser.close();
  console.log('Banner saved to agentbot-banner.png');
})();
