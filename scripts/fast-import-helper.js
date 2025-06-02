const config = require('../src/config/environment');
const BrowserManager = require('../src/utils/browser');
const path = require('path');

async function fastImportHelper() {
  const browserManager = new BrowserManager();
  let page = null;

  try {
    console.log('Fast Import Helper - Direct navigation to import');
    
    page = await browserManager.initialize();
    
    // Go directly to login page
    await page.goto(config.baseUrl);
    
    // Fill credentials quickly
    await page.waitForSelector('input[name="email"]');
    await page.type('input[name="email"]', config.username);
    await page.type('input[type="password"]', config.password);
    
    console.log('Credentials filled. Please click Sign In button in browser...');
    console.log('Browser will wait for you to complete login manually.');
    
    // Simple wait for navigation - just wait for dashboard URL
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 120000 });
    
    console.log('Login completed. Navigating to import...');
    
    // Go directly to import URL
    const importUrl = config.baseUrl.replace(/\/$/, '') + '/dashboard/file-import';
    await page.goto(importUrl);
    
    console.log('\n===========================================');
    console.log('READY FOR IMPORT');
    console.log('===========================================');
    console.log('CSV Files to import:');
    console.log(`- Schemes: ${path.resolve('../data/schemes-template.csv')}`);
    console.log(`- Projects: ${path.resolve('../data/projects-template.csv')}`);
    console.log(`- Inspectors: ${path.resolve('../data/inspectors-template.csv')}`);
    console.log('\n1. Click "Import" button');
    console.log('2. Select type, upload file, follow wizard');
    console.log('3. Repeat for other types');
    console.log('===========================================');
    
    // Keep browser open
    await new Promise(() => {});
    
  } catch (error) {
    console.error('Failed:', error.message);
  }
}

fastImportHelper();