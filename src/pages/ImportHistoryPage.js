const logger = require('../utils/logger');
const SELECTORS = require('../constants/selectors');

class ImportHistoryPage {
  constructor(page) {
    this.page = page;
  }

  async navigateToImport() {
    logger.info('Navigating to import section');

    // Step 1: Click Team in navigation (left sidebar)
    await this.page.waitForSelector('text=Team');
    await this.page.click('text=Team');
    logger.info('Clicked Team menu');

    // Wait for submenu to expand
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 2: Click File Import in sub-menu
    await this.page.waitForSelector('text=File Import');
    await this.page.click('text=File Import');
    logger.info('Clicked File Import');

    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Click the Import button
    await this.page.waitForSelector(SELECTORS.IMPORT.IMPORT_BUTTON);
    await this.page.click(SELECTORS.IMPORT.IMPORT_BUTTON);

    logger.info('Clicked Import button');
  }

  async selectImportType(importType) {
    logger.info(`Selecting import type: ${importType}`);

    // Wait for the modal dialog with file type options
    await this.page.waitForSelector(SELECTORS.IMPORT.FILE_TYPE_MODAL);

    // Click on the type name (like "Schemes")
    const typeName = importType.charAt(0).toUpperCase() + importType.slice(1);
    await this.page.click(`span:has-text("${typeName}")`);
    
    // Also click the radio input to ensure selection
    const radioSelector = SELECTORS.IMPORT.RADIO_BUTTON(importType);
    await this.page.click(radioSelector);

    // Click Next button
    await this.page.click(SELECTORS.IMPORT.NEXT_BUTTON);

    logger.info(`Selected import type: ${importType}`);
  }
}

module.exports = ImportHistoryPage;