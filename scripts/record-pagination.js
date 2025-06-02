const config = require('../src/config/environment');
const BrowserManager = require('../src/utils/browser');
const fs = require('fs');

async function recordPagination() {
  const browserManager = new BrowserManager();
  let page = null;
  const paginationSteps = [];

  try {
    console.log('Recording Pagination Flow - Capture pagination clicks');
    
    page = await browserManager.initialize();
    
    // Inject click recording
    await page.evaluateOnNewDocument(() => {
      window.paginationClicks = [];
      
      document.addEventListener('click', (event) => {
        const element = event.target;
        const clickData = {
          timestamp: new Date().toISOString(),
          tagName: element.tagName,
          text: element.textContent?.trim() || '',
          className: element.className,
          id: element.id,
          value: element.value || null,
          type: element.type || null,
          url: window.location.href,
          purpose: 'pagination'
        };
        
        window.paginationClicks.push(clickData);
        
        // Visual feedback
        element.style.outline = '3px solid orange';
        setTimeout(() => {
          element.style.outline = '';
        }, 1500);
        
        console.log('Pagination click recorded:', clickData);
      }, true);
    });
    
    // Fast authentication
    await page.goto(config.baseUrl);
    await page.waitForSelector('input[name="email"]');
    await page.type('input[name="email"]', config.username);
    await page.type('input[type="password"]', config.password);
    
    console.log('Credentials filled. Please click Sign In...');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 120000 });
    
    console.log('\n===========================================');
    console.log('PAGINATION RECORDING INSTRUCTIONS');
    console.log('===========================================');
    console.log('1. Navigate to Team > Members (inspectors page)');
    console.log('2. Look for pagination controls (10, 25, 50, All, etc.)');
    console.log('3. Click to show ALL members (all 16 records)');
    console.log('4. Navigate to Team > Competency categories');  
    console.log('5. Click to show ALL categories (all 7 schemes)');
    console.log('6. Navigate to Projects if needed');
    console.log('7. Click to show ALL projects');
    console.log('8. Press Ctrl+C when done');
    console.log('===========================================');
    console.log('Current results show:');
    console.log('- Inspectors: 10/16 displayed (need 6 more)');
    console.log('- Schemes: 5/7 displayed (need 2 more)');
    console.log('- Projects: 8/8 displayed (complete)');
    console.log('===========================================');
    
    // Monitor clicks every 3 seconds
    const interval = setInterval(async () => {
      try {
        const clicks = await page.evaluate(() => window.paginationClicks || []);
        if (clicks.length > paginationSteps.length) {
          const newClicks = clicks.slice(paginationSteps.length);
          newClicks.forEach((click, i) => {
            paginationSteps.push(click);
            console.log(`Pagination Step ${paginationSteps.length}: ${click.tagName} "${click.text}" ${click.type ? `(${click.type})` : ''} on ${click.url}`);
          });
        }
      } catch (e) {
        // Page might be navigating
      }
    }, 3000);
    
    // Run until user stops
    await new Promise(() => {});
    
  } catch (error) {
    if (error.message.includes('Target closed')) {
      console.log('Recording session ended by user');
    } else {
      console.error('Recording failed:', error);
    }
  } finally {
    // Save pagination flow
    if (paginationSteps.length > 0) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const outputFile = `pagination-flow-${timestamp}.json`;
      
      // Group steps by URL for analysis
      const pageAnalysis = {};
      paginationSteps.forEach(step => {
        const url = step.url;
        if (!pageAnalysis[url]) {
          pageAnalysis[url] = [];
        }
        pageAnalysis[url].push(step);
      });
      
      const report = {
        totalSteps: paginationSteps.length,
        pagesVisited: Object.keys(pageAnalysis).length,
        steps: paginationSteps,
        pageAnalysis: pageAnalysis,
        summary: 'Pagination controls for showing all data'
      };
      
      fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));
      
      console.log('\n===========================================');
      console.log('PAGINATION FLOW RECORDED');
      console.log('===========================================');
      console.log(`📁 Saved ${paginationSteps.length} steps to: ${outputFile}`);
      console.log(`📄 Visited ${Object.keys(pageAnalysis).length} different pages`);
      
      // Show page analysis
      Object.entries(pageAnalysis).forEach(([url, steps]) => {
        console.log(`\n${url}:`);
        steps.forEach((step, i) => {
          console.log(`  ${i+1}. ${step.tagName}: "${step.text}" ${step.type ? `(${step.type})` : ''}`);
        });
      });
      
      console.log('\n✅ Use this data to add proper pagination to validator');
    }
    
    if (browserManager) {
      await browserManager.close();
    }
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping pagination recording...');
  process.exit(0);
});

recordPagination();