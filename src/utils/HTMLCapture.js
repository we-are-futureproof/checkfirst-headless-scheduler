const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class HTMLCapture {
  constructor() {
    this.debugDir = 'debug/html';
    this.ensureDebugDirectory();
  }

  ensureDebugDirectory() {
    if (!fs.existsSync('debug')) {
      fs.mkdirSync('debug', { recursive: true });
    }
    if (!fs.existsSync(this.debugDir)) {
      fs.mkdirSync(this.debugDir, { recursive: true });
    }
  }

  async captureHTML(page, stepName, context = {}) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${stepName}-${timestamp}.html`;
      const filepath = path.join(this.debugDir, filename);

      // Get the raw HTML
      const html = await page.content();
      
      // Get current URL
      const url = await page.url();
      
      // Create enhanced HTML with debugging info
      const enhancedHTML = this.createEnhancedHTML(html, {
        stepName,
        timestamp,
        url,
        context
      });

      fs.writeFileSync(filepath, enhancedHTML);
      
      logger.info(`📄 HTML captured: ${filepath}`);
      
      // Also analyze and suggest selectors
      const analysis = this.analyzePage(html, stepName);
      const analysisFile = filepath.replace('.html', '-analysis.json');
      fs.writeFileSync(analysisFile, JSON.stringify(analysis, null, 2));
      
      return {
        htmlFile: filepath,
        analysisFile,
        analysis
      };
    } catch (error) {
      logger.error('Failed to capture HTML:', error);
      return null;
    }
  }

  createEnhancedHTML(originalHTML, metadata) {
    const debugInfo = `
<!-- DEBUG INFO -->
<!-- Step: ${metadata.stepName} -->
<!-- Timestamp: ${metadata.timestamp} -->
<!-- URL: ${metadata.url} -->
<!-- Context: ${JSON.stringify(metadata.context)} -->

<style>
  .debug-info {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #f0f0f0;
    border-bottom: 2px solid #ccc;
    padding: 10px;
    font-family: monospace;
    font-size: 12px;
    z-index: 10000;
    color: #333;
  }
  .debug-highlight {
    border: 2px solid red !important;
    background: rgba(255, 0, 0, 0.1) !important;
  }
</style>

<div class="debug-info">
  <strong>DEBUG:</strong> ${metadata.stepName} | ${metadata.timestamp} | ${metadata.url}
</div>

`;

    // Insert debug info after <head> tag
    return originalHTML.replace('<head>', '<head>' + debugInfo);
  }

  analyzePage(html, stepName) {
    const analysis = {
      step: stepName,
      timestamp: new Date().toISOString(),
      suggestedSelectors: {},
      commonElements: {}
    };

    // Analyze based on step type
    if (stepName.toLowerCase().includes('login')) {
      analysis.suggestedSelectors = this.analyzeLoginPage(html);
    } else if (stepName.toLowerCase().includes('import')) {
      analysis.suggestedSelectors = this.analyzeImportPage(html);
    } else if (stepName.toLowerCase().includes('upload')) {
      analysis.suggestedSelectors = this.analyzeUploadPage(html);
    }

    // Find common interactive elements
    analysis.commonElements = this.findCommonElements(html);

    return analysis;
  }

  analyzeLoginPage(html) {
    const selectors = {};
    
    // Email input patterns
    const emailPatterns = [
      'input[type="email"]',
      'input[name*="email" i]',
      'input[placeholder*="email" i]',
      'input[id*="email" i]',
      'input[class*="email" i]'
    ];
    
    // Password input patterns
    const passwordPatterns = [
      'input[type="password"]',
      'input[name*="password" i]',
      'input[placeholder*="password" i]',
      'input[id*="password" i]',
      'input[class*="password" i]'
    ];
    
    // Submit button patterns
    const submitPatterns = [
      'button[type="submit"]',
      'button:contains("Sign in")',
      'button:contains("Login")',
      'button:contains("Submit")',
      'input[type="submit"]',
      '[role="button"]:contains("Sign in")',
      'button[class*="submit" i]',
      'button[id*="submit" i]'
    ];

    selectors.emailInput = this.findBestSelector(html, emailPatterns);
    selectors.passwordInput = this.findBestSelector(html, passwordPatterns);
    selectors.submitButton = this.findBestSelector(html, submitPatterns);

    return selectors;
  }

  analyzeImportPage(html) {
    const selectors = {};
    
    const importPatterns = [
      'button:contains("Import")',
      'a:contains("Import")',
      '[role="button"]:contains("Import")',
      'button[class*="import" i]'
    ];
    
    const nextPatterns = [
      'button:contains("Next")',
      'button[type="submit"]',
      '[role="button"]:contains("Next")'
    ];

    selectors.importButton = this.findBestSelector(html, importPatterns);
    selectors.nextButton = this.findBestSelector(html, nextPatterns);

    return selectors;
  }

  analyzeUploadPage(html) {
    const selectors = {};
    
    const fileInputPatterns = [
      'input[type="file"]',
      'input[accept*="csv" i]',
      '[class*="upload" i] input[type="file"]'
    ];
    
    const dropZonePatterns = [
      '[class*="drop" i]',
      '[class*="upload" i]',
      'text*="drop" i',
      'text*="select file" i'
    ];

    selectors.fileInput = this.findBestSelector(html, fileInputPatterns);
    selectors.dropZone = this.findBestSelector(html, dropZonePatterns);

    return selectors;
  }

  findBestSelector(html, patterns) {
    const results = [];
    
    for (const pattern of patterns) {
      // Simple regex-based matching for analysis
      // In a real implementation, you'd use a proper HTML parser
      if (pattern.includes('contains') || pattern.includes('text')) {
        // Handle text-based selectors
        const textMatch = pattern.match(/["']([^"']+)["']/);
        if (textMatch) {
          const searchText = textMatch[1];
          if (html.toLowerCase().includes(searchText.toLowerCase())) {
            results.push({
              selector: pattern,
              confidence: 'medium',
              reason: `Found text "${searchText}" in HTML`
            });
          }
        }
      } else {
        // Handle attribute-based selectors
        const attrMatch = pattern.match(/\[([^\]]+)\]/);
        if (attrMatch) {
          const attribute = attrMatch[1];
          if (html.includes(attribute.split('=')[0])) {
            results.push({
              selector: pattern,
              confidence: 'high',
              reason: `Found attribute pattern in HTML`
            });
          }
        }
      }
    }
    
    return results.length > 0 ? results : [{ 
      selector: 'none found', 
      confidence: 'none',
      reason: 'No matching patterns found'
    }];
  }

  findCommonElements(html) {
    const elements = {};
    
    // Count common form elements
    elements.buttons = (html.match(/<button/gi) || []).length;
    elements.inputs = (html.match(/<input/gi) || []).length;
    elements.forms = (html.match(/<form/gi) || []).length;
    elements.links = (html.match(/<a /gi) || []).length;
    
    // Look for common attributes
    elements.hasDataTestId = html.includes('data-testid');
    elements.hasDataCy = html.includes('data-cy');
    elements.hasAriaLabels = html.includes('aria-label');
    elements.hasRoles = html.includes('role=');
    
    return elements;
  }

  async captureAndAnalyze(page, stepName, context = {}) {
    const result = await this.captureHTML(page, stepName, context);
    
    if (result && result.analysis) {
      logger.info(`🔍 HTML Analysis for ${stepName}:`);
      logger.info(JSON.stringify(result.analysis.suggestedSelectors, null, 2));
    }
    
    return result;
  }
}

module.exports = HTMLCapture;