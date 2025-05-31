const logger = require('../utils/logger');

class ImportHistoryPage {
  constructor(page) {
    this.page = page;
  }

  async navigateToImport() {
    logger.info('Navigating to import section');

    // Navigate to import history page
    const importUrl = `${this.page.url().split('/dashboard')[0]}/dashboard/file-import`;
    await this.page.goto(importUrl, { waitUntil: 'networkidle2' });

    // Click the Import button in top right
    await this.page.waitForSelector('button:has-text("Import"), a:has-text("Import")');
    await this.page.click('button:has-text("Import"), a:has-text("Import")');

    logger.info('Clicked Import button');
  }

  async selectImportType(importType) {
    logger.info(`Selecting import type: ${importType}`);

    // Wait for the modal dialog with file type options
    await this.page.waitForSelector('text=Select the file type');

    // Select the appropriate radio button based on import type
    const radioSelector = `input[type="radio"][value="${importType}"], label:has-text("${importType}") input[type="radio"]`;
    await this.page.click(radioSelector);

    // Click Next button
    await this.page.click('button:has-text("Next")');

    logger.info(`Selected import type: ${importType}`);
  }
}

module.exports = ImportHistoryPage;