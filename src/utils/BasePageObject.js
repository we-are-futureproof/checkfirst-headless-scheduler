const logger = require('./logger');
const { AutomationError } = require('../errors/AutomationError');

class BasePageObject {
  constructor(page) {
    this.page = page;
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
        await this.page.waitForTimeout(waitTime);
      }
    }
  }

  async waitForElementWithValidation(selector, options = {}) {
    const { timeout = 10000, visible = true, operationName = 'element wait' } = options;
    
    try {
      const startTime = Date.now();
      const element = await this.page.waitForSelector(selector, { 
        visible, 
        timeout 
      });
      const duration = Date.now() - startTime;
      
      if (!element) {
        throw new AutomationError(
          `Element not found: ${selector}`,
          'ELEMENT_NOT_FOUND',
          { selector, timeout, visible }
        );
      }
      
      logger.info(`✅ ${operationName} - Element found: ${selector} (${duration}ms)`);
      return element;
    } catch (error) {
      if (error.name === 'TimeoutError') {
        throw new AutomationError(
          `Timeout waiting for element: ${selector}`,
          'ELEMENT_TIMEOUT',
          { selector, timeout, visible }
        );
      }
      throw error;
    }
  }

  async clickWithRetry(selector, options = {}) {
    const { maxRetries = 3, operationName = `click ${selector}` } = options;
    
    return this.retryOperation(async () => {
      await this.waitForElementWithValidation(selector, { operationName });
      await this.page.click(selector);
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