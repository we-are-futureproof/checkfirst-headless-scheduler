const config = require('../src/config/environment');
const BrowserManager = require('../src/utils/browser');
const fs = require('fs');

// Parse CSV file to get expected row count
function getCSVRowCount(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.trim().split('\n');
  return lines.length - 1; // Subtract header row
}

// Expected data from CSV files
const expectedData = {
  schemes: {
    file: '../data/schemes-template.csv',
    expectedRows: getCSVRowCount('../data/schemes-template.csv')
  },
  projects: {
    file: '../data/projects-template.csv', 
    expectedRows: getCSVRowCount('../data/projects-template.csv')
  },
  inspectors: {
    file: '../data/inspectors-template.csv',
    expectedRows: getCSVRowCount('../data/inspectors-template.csv')
  }
};

async function validateFromHistory() {
  const browserManager = new BrowserManager();
  let page = null;

  try {
    console.log('Import History Validator - Checking import results');
    
    page = await browserManager.initialize();
    
    // Go to import history page
    await page.goto(config.baseUrl + '/dashboard/file-import');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\nExtracting import history data...');
    
    // Extract table data from import history
    const importHistory = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tr'));
      if (rows.length < 2) return [];
      
      const headerRow = rows[0];
      const headers = Array.from(headerRow.cells).map(cell => cell.textContent.trim());
      
      return rows.slice(1).map(row => {
        const cells = Array.from(row.cells);
        const rowData = {};
        headers.forEach((header, index) => {
          rowData[header] = cells[index] ? cells[index].textContent.trim() : '';
        });
        return rowData;
      });
    });
    
    console.log(`Found ${importHistory.length} import records`);
    
    // Validation results
    const results = {};
    
    for (const [importType, expected] of Object.entries(expectedData)) {
      // Find the most recent import for this type
      const typeImports = importHistory.filter(record => 
        record.Type && record.Type.toLowerCase() === importType.toLowerCase()
      );
      
      if (typeImports.length === 0) {
        results[importType] = {
          status: 'MISSING',
          expected: expected.expectedRows,
          found: 0,
          message: `No ${importType} import found in history`
        };
        continue;
      }
      
      // Get the most recent import (first in list)
      const latestImport = typeImports[0];
      const processedRows = parseInt(latestImport['Total Rows processed'] || '0');
      const status = latestImport.Status || '';
      const fileName = latestImport['File Name'] || '';
      
      // Validate
      const isCompleted = status.toLowerCase().includes('completed');
      const rowsMatch = processedRows === expected.expectedRows;
      const fileNameMatch = fileName.includes(`${importType}-template.csv`);
      
      let validationStatus = 'PASS';
      let issues = [];
      
      if (!isCompleted) {
        validationStatus = 'FAIL';
        issues.push(`Status: ${status}`);
      }
      
      if (!rowsMatch) {
        validationStatus = 'FAIL';
        issues.push(`Row count mismatch: expected ${expected.expectedRows}, processed ${processedRows}`);
      }
      
      if (!fileNameMatch) {
        validationStatus = 'WARNING';
        issues.push(`File name mismatch: ${fileName}`);
      }
      
      results[importType] = {
        status: validationStatus,
        expected: expected.expectedRows,
        found: processedRows,
        importStatus: status,
        fileName: fileName,
        issues: issues,
        accuracy: rowsMatch ? 100 : Math.round((processedRows / expected.expectedRows) * 100)
      };
    }
    
    // Generate report
    console.log('\n===========================================');
    console.log('IMPORT VALIDATION REPORT');
    console.log('===========================================');
    
    Object.entries(results).forEach(([type, result]) => {
      console.log(`\n${type.toUpperCase()}:`);
      console.log(`  Status: ${result.status}`);
      console.log(`  Expected rows: ${result.expected}`);
      console.log(`  Processed rows: ${result.found}`);
      console.log(`  Accuracy: ${result.accuracy}%`);
      console.log(`  Import status: ${result.importStatus}`);
      console.log(`  File: ${result.fileName}`);
      
      if (result.issues && result.issues.length > 0) {
        console.log(`  Issues: ${result.issues.join(', ')}`);
      }
    });
    
    // Summary
    const passCount = Object.values(results).filter(r => r.status === 'PASS').length;
    const totalCount = Object.keys(results).length;
    const totalExpected = Object.values(expectedData).reduce((sum, data) => sum + data.expectedRows, 0);
    const totalProcessed = Object.values(results).reduce((sum, result) => sum + result.found, 0);
    
    console.log('\n===========================================');
    console.log('SUMMARY');
    console.log('===========================================');
    console.log(`Imports validated: ${passCount}/${totalCount} PASSED`);
    console.log(`Total rows: ${totalProcessed}/${totalExpected} processed (${Math.round((totalProcessed/totalExpected)*100)}%)`);
    
    if (passCount === totalCount) {
      console.log('✅ ALL IMPORTS VALIDATED SUCCESSFULLY');
    } else {
      console.log('❌ SOME IMPORTS HAVE ISSUES - CHECK DETAILS ABOVE');
    }
    
    // Save results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    fs.writeFileSync(
      `validation-history-${timestamp}.json`, 
      JSON.stringify({ results, summary: { passCount, totalCount, totalExpected, totalProcessed } }, null, 2)
    );
    
    console.log(`\nDetailed results saved to validation-history-${timestamp}.json`);
    console.log('===========================================');
    
    await page.screenshot({ 
      path: `screenshots/import-history-validation-${Date.now()}.png`,
      fullPage: true 
    });
    
    console.log('\nPress Ctrl+C to exit or browser will stay open...');
    await new Promise(() => {});
    
  } catch (error) {
    console.error('Validation failed:', error);
  }
}

validateFromHistory();