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

async function validateImportedData() {
  const browserManager = new BrowserManager();
  let page = null;

  try {
    console.log('Automated Data Validator - Based on recorded navigation');

    page = await browserManager.initialize();

    // Fast authentication
    await page.goto(config.baseUrl);
    await page.waitForSelector('input[name="email"]');
    await page.type('input[name="email"]', config.username);
    await page.type('input[type="password"]', config.password);

    console.log('Credentials filled. Please click Sign In in the browser...');
    console.log('Waiting for you to complete login manually...');

    // Wait for navigation to dashboard
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 120000 });

    console.log('Login completed! Starting data validation...');

    // Wait a bit more to ensure we're fully authenticated
    await new Promise(resolve => setTimeout(resolve, 3000));

    const results = {};

    // Validation 1: INSPECTORS - Team > Members
    console.log('\nValidating INSPECTORS data...');
    try {
      const csvData = parseCSVData(path.join(projectRoot, 'data/inspectors-template.csv'));
      console.log(`Expected ${csvData.count} inspectors`);

      // Navigate: Team > Members (based on your recording)
      await page.click('text=Team');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Find and click Members
      await page.evaluate(() => {
        const spans = Array.from(document.querySelectorAll('span'));
        const membersSpan = spans.find(span => span.textContent.trim() === 'Members');
        if (membersSpan) {
          membersSpan.click();
        } else {
          throw new Error('Members link not found');
        }
      });
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Handle pagination - click "50" option to show all records
      try {
        const fiftyOption = await page.$('li:has-text("50")');
        if (fiftyOption) {
          await fiftyOption.click();
          await new Promise(resolve => setTimeout(resolve, 3000));
          console.log('Selected 50 items per page for inspectors');
        } else {
          console.log('50 option not found for inspectors pagination');
        }
      } catch (e) {
        console.log('Could not handle pagination for inspectors');
      }

      // Extract data from Material-UI grid
      const inspectorData = await page.evaluate(() => {
        // Try multiple selectors for data extraction
        let data = [];

        // Method 1: Look for data rows in Material-UI table
        const dataRows = document.querySelectorAll('[role="row"]');
        if (dataRows.length > 1) {
          data = Array.from(dataRows).slice(1).map(row => {
            const cells = row.querySelectorAll('[role="cell"], [role="gridcell"]');
            return Array.from(cells).map(cell => cell.textContent?.trim() || '');
          });
        }

        // Method 2: If no role-based rows, look for any text content
        if (data.length === 0) {
          const allText = document.body.textContent || '';
          data = [allText]; // Return as single text block for pattern matching
        }

        return data;
      });

      // Look for CSV inspector names in the page data
      let foundMatches = 0;
      if (inspectorData.length > 0) {
        foundMatches = csvData.rows.filter(csvRow => {
          const inspectorName = csvRow.name;

          // Check structured data (arrays of cells)
          if (Array.isArray(inspectorData[0])) {
            return inspectorData.some(row =>
              row.some(cell => cell && cell.includes(inspectorName))
            );
          }
          // Check text data (single string)
          else {
            return inspectorData.some(text => text && text.includes(inspectorName));
          }
        }).length;
      }

      const accuracy = foundMatches > 0 ? Math.round((foundMatches / csvData.count) * 100) : 0;
      results.inspectors = {
        status: foundMatches >= csvData.count ? 'PASS' : foundMatches > 0 ? 'WARNING' : 'FAIL',
        expected: csvData.count,
        found: foundMatches,
        totalDisplayed: inspectorData.length,
        accuracy: accuracy,
        url: '/dashboard/member'
      };

      console.log(`Found ${foundMatches}/${csvData.count} inspector names (${accuracy}%)`);

      // Ensure screenshots directory exists
      const screenshotsDir = path.join(projectRoot, 'screenshots');
      if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
      }

      await page.screenshot({
        path: `screenshots/validation-inspectors-${Date.now()}.png`,
        fullPage: true
      });

    } catch (error) {
      console.log('Inspector validation error:', error.message);
      results.inspectors = { status: 'ERROR', error: error.message };
    }

    // Validation 2: SCHEMES - Look in competency categories (from your recording)
    console.log('\nValidating SCHEMES data...');
    try {
      const csvData = parseCSVData(path.join(projectRoot, 'data/schemes-template.csv'));
      console.log(`Expected ${csvData.count} schemes`);

      // Navigate: Team > Competency categories (based on your recording)
      await page.evaluate(() => {
        const spans = Array.from(document.querySelectorAll('span'));
        const competencySpan = spans.find(span => span.textContent.includes('Competency'));
        if (competencySpan) {
          competencySpan.click();
        } else {
          throw new Error('Competency categories link not found');
        }
      });
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Handle pagination - click "50" option to show all records
      try {
        const fiftyOption = await page.$('li:has-text("50")');
        if (fiftyOption) {
          await fiftyOption.click();
          await new Promise(resolve => setTimeout(resolve, 3000));
          console.log('Selected 50 items per page for schemes');
        } else {
          console.log('50 option not found for schemes pagination');
        }
      } catch (e) {
        console.log('Could not handle pagination for schemes');
      }

      // Extract data from Material-UI grid
      const schemeData = await page.evaluate(() => {
        let data = [];

        // Method 1: Look for data rows in Material-UI table
        const dataRows = document.querySelectorAll('[role="row"]');
        if (dataRows.length > 1) {
          data = Array.from(dataRows).slice(1).map(row => {
            const cells = row.querySelectorAll('[role="cell"], [role="gridcell"]');
            return Array.from(cells).map(cell => cell.textContent?.trim() || '');
          });
        }

        // Method 2: If no role-based rows, look for any text content
        if (data.length === 0) {
          const allText = document.body.textContent || '';
          data = [allText];
        }

        return data;
      });

      // Look for BRC codes from CSV
      let foundMatches = 0;
      if (schemeData.length > 0) {
        foundMatches = csvData.rows.filter(csvRow => {
          const schemeName = csvRow.name; // BRC01, BRC02, etc.

          // Check structured data (arrays of cells)
          if (Array.isArray(schemeData[0])) {
            return schemeData.some(row =>
              row.some(cell => cell && cell.includes(schemeName))
            );
          }
          // Check text data (single string)
          else {
            return schemeData.some(text => text && text.includes(schemeName));
          }
        }).length;
      }

      const accuracy = foundMatches > 0 ? Math.round((foundMatches / csvData.count) * 100) : 0;
      results.schemes = {
        status: foundMatches >= csvData.count ? 'PASS' : foundMatches > 0 ? 'WARNING' : 'FAIL',
        expected: csvData.count,
        found: foundMatches,
        totalDisplayed: schemeData.length,
        accuracy: accuracy,
        url: '/dashboard/competency-categories'
      };

      console.log(`Found ${foundMatches}/${csvData.count} scheme codes (${accuracy}%)`);

      // Ensure screenshots directory exists
      const screenshotsDir = path.join(projectRoot, 'screenshots');
      if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
      }

      await page.screenshot({
        path: `screenshots/validation-schemes-${Date.now()}.png`,
        fullPage: true
      });

    } catch (error) {
      console.log('Schemes validation error:', error.message);
      results.schemes = { status: 'ERROR', error: error.message };
    }

    // Validation 3: PROJECTS - Try Projects page
    console.log('\nValidating PROJECTS data...');
    try {
      const csvData = parseCSVData(path.join(projectRoot, 'data/projects-template.csv'));
      console.log(`Expected ${csvData.count} projects`);

      // Navigate to Projects
      await page.click('text=Projects');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Handle pagination - click "50" option to show all records
      try {
        const fiftyOption = await page.$('li:has-text("50")');
        if (fiftyOption) {
          await fiftyOption.click();
          await new Promise(resolve => setTimeout(resolve, 3000));
          console.log('Selected 50 items per page for projects');
        } else {
          console.log('50 option not found for projects pagination');
        }
      } catch (e) {
        console.log('Could not handle pagination for projects');
      }

      // Extract data from Material-UI grid
      const projectData = await page.evaluate(() => {
        let data = [];

        // Method 1: Look for data rows in Material-UI table
        const dataRows = document.querySelectorAll('[role="row"]');
        if (dataRows.length > 1) {
          data = Array.from(dataRows).slice(1).map(row => {
            const cells = row.querySelectorAll('[role="cell"], [role="gridcell"]');
            return Array.from(cells).map(cell => cell.textContent?.trim() || '');
          });
        }

        // Method 2: If no role-based rows, look for any text content
        if (data.length === 0) {
          const allText = document.body.textContent || '';
          data = [allText];
        }

        return data;
      });

      // Look for project order references
      let foundMatches = 0;
      if (projectData.length > 0) {
        foundMatches = csvData.rows.filter(csvRow => {
          const orderRef = csvRow.order_reference; // Project-2025-000, etc.

          // Check structured data (arrays of cells)
          if (Array.isArray(projectData[0])) {
            return projectData.some(row =>
              row.some(cell => cell && cell.includes(orderRef))
            );
          }
          // Check text data (single string)
          else {
            return projectData.some(text => text && text.includes(orderRef));
          }
        }).length;
      }

      const accuracy = foundMatches > 0 ? Math.round((foundMatches / csvData.count) * 100) : 0;
      results.projects = {
        status: foundMatches >= csvData.count ? 'PASS' : foundMatches > 0 ? 'WARNING' : 'FAIL',
        expected: csvData.count,
        found: foundMatches,
        totalDisplayed: projectData.length,
        accuracy: accuracy,
        url: '/dashboard/projects'
      };

      console.log(`Found ${foundMatches}/${csvData.count} project references (${accuracy}%)`);

      // Ensure screenshots directory exists
      const screenshotsDir = path.join(projectRoot, 'screenshots');
      if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
      }

      await page.screenshot({
        path: `screenshots/validation-projects-${Date.now()}.png`,
        fullPage: true
      });

    } catch (error) {
      console.log('Projects validation error:', error.message);
      results.projects = { status: 'ERROR', error: error.message };
    }

    // Generate final report
    console.log('\n===========================================');
    console.log('DATA VALIDATION RESULTS');
    console.log('===========================================');

    Object.entries(results).forEach(([dataType, result]) => {
      console.log(`\n${dataType.toUpperCase()}:`);
      console.log(`  Status: ${result.status}`);

      if (result.status === 'ERROR') {
        console.log(`  Error: ${result.error}`);
      } else {
        console.log(`  Expected: ${result.expected} records`);
        console.log(`  Found: ${result.found} matches`);
        console.log(`  Total displayed: ${result.totalDisplayed} rows`);
        console.log(`  Accuracy: ${result.accuracy}%`);
        console.log(`  Page: ${result.url}`);
      }
    });

    // Summary
    const passCount = Object.values(results).filter(r => r.status === 'PASS').length;
    const warningCount = Object.values(results).filter(r => r.status === 'WARNING').length;
    const totalCount = Object.keys(results).length;

    console.log('\n===========================================');
    console.log('SUMMARY');
    console.log('===========================================');
    console.log(`PASSED: ${passCount}/${totalCount}`);
    console.log(`WARNINGS: ${warningCount}/${totalCount}`);
    console.log(`FAILED: ${totalCount - passCount - warningCount}/${totalCount}`);

    if (passCount === totalCount) {
      console.log('\nALL DATA VALIDATED SUCCESSFULLY!');
    } else if (passCount + warningCount === totalCount) {
      console.log('\nMOST DATA VALIDATED - Some matches found');
    } else {
      console.log('\nSOME DATA VALIDATION ISSUES - Check details above');
    }

    // Save results to logs directory
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logsDir = path.join(projectRoot, 'logs');
    const resultFile = path.join(logsDir, `validation-results-${timestamp}.json`);

    // Ensure logs directory exists
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    fs.writeFileSync(resultFile, JSON.stringify(results, null, 2));

    console.log(`\nDetailed results saved to logs/validation-results-${timestamp}.json`);
    console.log('Screenshots saved for manual verification');
    console.log('===========================================');

    console.log('\nPress Ctrl+C to exit...');
    await new Promise(() => {});

  } catch (error) {
    console.error('Validation failed:', error);
  } finally {
    if (page) await page.close();
    if (browserManager) await browserManager.close();
  }
}

validateImportedData();