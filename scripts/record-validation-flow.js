const config = require('../src/config/environment');
const BrowserManager = require('../src/utils/browser');
const fs = require('fs');
const path = require('path');

// Determine project root directory
const projectRoot = path.join(__dirname, '..');

// Parse CSV data for validation
function parseCSVData(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const rows = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = values[i] || '';
    });
    return obj;
  });
  return { headers, rows, count: rows.length };
}

async function recordValidationFlow() {
  const browserManager = new BrowserManager();
  let page = null;
  const validationSteps = [];

  try {
    console.log('Recording Validation Flow - Fast auth + manual navigation');
    
    page = await browserManager.initialize();
    
    // Inject click recording (similar to before)
    await page.evaluateOnNewDocument(() => {
      window.validationClicks = [];
      
      document.addEventListener('click', (event) => {
        const element = event.target;
        const clickData = {
          timestamp: new Date().toISOString(),
          tagName: element.tagName,
          text: element.textContent?.trim() || '',
          className: element.className,
          id: element.id,
          href: element.href || null,
          url: window.location.href,
          purpose: 'navigation' // We'll update this
        };
        
        window.validationClicks.push(clickData);
        
        // Visual feedback
        element.style.outline = '2px solid blue';
        setTimeout(() => {
          element.style.outline = '';
        }, 1000);
        
        console.log('Navigation recorded:', clickData);
      }, true);
    });
    
    // Fast authentication
    console.log('Starting fast authentication...');
    await page.goto(config.baseUrl);
    await page.waitForSelector('input[name="email"]');
    await page.type('input[name="email"]', config.username);
    await page.type('input[type="password"]', config.password);
    
    console.log('Credentials filled. Please click Sign In...');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 120000 });
    
    // Parse CSV data for reference
    const csvData = {
      schemes: parseCSVData(path.join(projectRoot, 'data/schemes-template.csv')),
      projects: parseCSVData(path.join(projectRoot, 'data/projects-template.csv')),
      inspectors: parseCSVData(path.join(projectRoot, 'data/inspectors-template.csv'))
    };
    
    console.log('\n===========================================');
    console.log('MANUAL VALIDATION INSTRUCTIONS');
    console.log('===========================================');
    console.log('Expected data to find:');
    console.log(`- ${csvData.schemes.count} SCHEMES (names: ${csvData.schemes.rows.slice(0,3).map(r => r.name).join(', ')}...)`);
    console.log(`- ${csvData.projects.count} PROJECTS (refs: ${csvData.projects.rows.slice(0,3).map(r => r.order_reference).join(', ')}...)`);  
    console.log(`- ${csvData.inspectors.count} INSPECTORS (names: ${csvData.inspectors.rows.slice(0,3).map(r => r.name).join(', ')}...)`);
    console.log('\nPlease navigate through the app and:');
    console.log('1. Find where SCHEMES are displayed');
    console.log('2. Find where PROJECTS are displayed'); 
    console.log('3. Find where INSPECTORS/TEAM MEMBERS are displayed');
    console.log('4. Click on elements to record the navigation path');
    console.log('5. Press Ctrl+C when done');
    console.log('===========================================');
    
    // Monitor clicks every 3 seconds
    const interval = setInterval(async () => {
      try {
        const clicks = await page.evaluate(() => window.validationClicks || []);
        if (clicks.length > validationSteps.length) {
          const newClicks = clicks.slice(validationSteps.length);
          newClicks.forEach((click, i) => {
            validationSteps.push(click);
            console.log(`Step ${validationSteps.length}: ${click.tagName} "${click.text}" on ${click.url}`);
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
    // Save validation flow
    if (validationSteps.length > 0) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const logsDir = path.join(projectRoot, 'logs');
      const outputFile = path.join(logsDir, `validation-flow-${timestamp}.json`);
      
      // Ensure logs directory exists
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      
      // Group steps by URL for analysis
      const pageAnalysis = {};
      validationSteps.forEach(step => {
        const url = step.url;
        if (!pageAnalysis[url]) {
          pageAnalysis[url] = [];
        }
        pageAnalysis[url].push(step);
      });
      
      const report = {
        totalSteps: validationSteps.length,
        pagesVisited: Object.keys(pageAnalysis).length,
        steps: validationSteps,
        pageAnalysis: pageAnalysis,
        csvData: {
          schemes: csvData.schemes.count,
          projects: csvData.projects.count, 
          inspectors: csvData.inspectors.count
        }
      };
      
      fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));
      
      console.log('\n===========================================');
      console.log('VALIDATION FLOW RECORDED');
      console.log('===========================================');
      console.log(`📁 Saved ${validationSteps.length} steps to: logs/${path.basename(outputFile)}`);
      console.log(`📄 Visited ${Object.keys(pageAnalysis).length} different pages`);
      
      // Show page analysis
      Object.entries(pageAnalysis).forEach(([url, steps]) => {
        console.log(`\n${url}:`);
        steps.forEach((step, i) => {
          console.log(`  ${i+1}. ${step.tagName}: "${step.text}"`);
        });
      });
      
      console.log('\n✅ Use this data to create automated validation');
    }
    
    if (browserManager) {
      await browserManager.close();
    }
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping validation recording...');
  process.exit(0);
});

recordValidationFlow();