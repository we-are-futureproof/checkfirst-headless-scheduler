const logger = require('./logger');
const { AutomationError } = require('../errors/AutomationError');
const HTMLCapture = require('./HTMLCapture');
const config = require('../config/environment');

class BasePageObject {
  constructor(page) {
    this.page = page;
    this.htmlCapture = new HTMLCapture();
    this.debugMode = process.env.DEBUG_HTML === 'true' || process.env.NODE_ENV === 'development';
  }

  async retryOperation(operation, maxRetries = 3, delay = 1000, operationName = 'operation') {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const startTime = Date.now();
        const result = await operation();
        const duration = Date.now() - startTime;
        logger.info(`✅ ${operationName} completed in ${duration}ms (attempt ${i + 1})`);
        return result;
      } catch (error) {
        const attempt = i + 1;
        logger.warn(`❌ ${operationName} failed on attempt ${attempt}/${maxRetries}: ${error.message}`);
        
        if (i === maxRetries - 1) {
          throw new AutomationError(
            `${operationName} failed after ${maxRetries} attempts: ${error.message}`,
            'RETRY_EXHAUSTED',
            { originalError: error.message, attempts: maxRetries }
          );
        }
        
        const waitTime = delay * (i + 1);
        logger.info(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  async captureHTML(stepName, context = {}) {
    if (this.debugMode) {
      return await this.htmlCapture.captureAndAnalyze(this.page, stepName, context);
    }
    return null;
  }

  async waitForElementWithValidation(selector, options = {}) {
    const { timeout = 10000, visible = true, operationName = 'element wait' } = options;
    
    // Capture HTML before attempting to find element
    await this.captureHTML(`before-${operationName}`, { selector, timeout, visible });
    
    // Handle multiple selectors separated by commas
    const selectors = selector.split(',').map(s => s.trim());
    
    for (const singleSelector of selectors) {
      try {
        const startTime = Date.now();
        let element;
        
        // Handle different selector types
        if (singleSelector.startsWith('xpath=')) {
          const xpathSelector = singleSelector.replace('xpath=', '');
          element = await this.page.waitForXPath(xpathSelector, { 
            visible, 
            timeout: timeout / selectors.length 
          });
        } else {
          element = await this.page.waitForSelector(singleSelector, { 
            visible, 
            timeout: timeout / selectors.length 
          });
        }
        
        const duration = Date.now() - startTime;
        
        if (element) {
          logger.info(`✅ ${operationName} - Element found: ${singleSelector} (${duration}ms)`);
          await this.captureHTML(`success-${operationName}`, { 
            foundSelector: singleSelector, 
            duration 
          });
          return element;
        }
      } catch (error) {
        // Continue to next selector if this one fails
        logger.debug(`Selector failed: ${singleSelector} - ${error.message}`);
        continue;
      }
    }
    
    // Capture HTML on failure for debugging
    await this.captureHTML(`failed-${operationName}`, { 
      failedSelectors: selectors,
      timeout,
      visible 
    });
    
    // If all selectors failed
    throw new AutomationError(
      `Timeout waiting for any element: ${selector}`,
      'ELEMENT_TIMEOUT',
      { selector, timeout, visible, attemptedSelectors: selectors }
    );
  }

  async clickWithRetry(selector, options = {}) {
    const { maxRetries = 3, operationName = `click ${selector}` } = options;
    
    return this.retryOperation(async () => {
      const element = await this.waitForElementWithValidation(selector, { operationName });
      
      // Handle different selector types for clicking
      const selectors = selector.split(',').map(s => s.trim());
      for (const singleSelector of selectors) {
        try {
          if (singleSelector.startsWith('xpath=')) {
            // For XPath, click the element directly
            await element.click();
          } else {
            // For CSS selectors, use page.click
            try {
              await this.page.click(singleSelector);
            } catch (e) {
              // Fallback to element click
              await element.click();
            }
          }
          return; // Success, exit
        } catch (error) {
          continue; // Try next selector
        }
      }
      
      // If all selectors failed, try element click as final fallback
      await element.click();
    }, maxRetries, 1000, operationName);
  }

  async typeWithRetry(selector, text, options = {}) {
    const { maxRetries = 3, operationName = `type in ${selector}` } = options;
    
    return this.retryOperation(async () => {
      await this.waitForElementWithValidation(selector, { operationName });
      await this.page.type(selector, text);
    }, maxRetries, 1000, operationName);
  }

  async navigateWithRetry(url, options = {}) {
    const { maxRetries = 3, waitUntil = 'networkidle2', operationName = `navigate to ${url}` } = options;
    
    return this.retryOperation(async () => {
      await this.page.goto(url, { waitUntil });
      // Capture HTML after successful navigation
      await this.captureHTML(`navigated-to-${operationName.replace(/[^a-zA-Z0-9]/g, '-')}`, { url, waitUntil });
    }, maxRetries, 2000, operationName);
  }

  async takeScreenshot(name, context = {}) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `screenshots/${name}-${timestamp}.png`;
      await this.page.screenshot({ path: filename, fullPage: true });
      logger.info(`📸 Screenshot saved: ${filename}`);
      return { filename, context };
    } catch (error) {
      logger.error('Failed to take screenshot:', error);
      return null;
    }
  }
}

module.exports = BasePageObject;