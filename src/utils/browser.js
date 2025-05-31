const puppeteer = require('puppeteer');
const config = require('../config/environment');
const logger = require('./logger');

class BrowserManager {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    try {
      logger.info('Launching browser...');
      this.browser = await puppeteer.launch({
        headless: config.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1280, height: 720 }
      });

      this.page = await this.browser.newPage();

      // Set timeouts
      this.page.setDefaultTimeout(config.timeouts.browser);
      this.page.setDefaultNavigationTimeout(config.timeouts.navigation);

      // Enable request interception for better debugging
      await this.page.setRequestInterception(true);
      this.page.on('request', (req) => {
        if (req.resourceType() === 'stylesheet' || req.resourceType() === 'font') {
          req.abort();
        } else {
          req.continue();
        }
      });

      logger.info('Browser initialized successfully');
      return this.page;
    } catch (error) {
      logger.error('Failed to initialize browser:', error);
      throw error;
    }
  }

  async takeScreenshot(name) {
    if (!this.page) return;

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `screenshots/${name}-${timestamp}.png`;
      await this.page.screenshot({ path: filename, fullPage: true });
      logger.info(`Screenshot saved: ${filename}`);
      return filename;
    } catch (error) {
      logger.error('Failed to take screenshot:', error);
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      logger.info('Browser closed');
    }
  }
}

module.exports = BrowserManager;