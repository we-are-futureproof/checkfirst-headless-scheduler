const logger = require('../utils/logger');

class ImportConfirmationPage {
  constructor(page) {
    this.page = page;
  }

  async confirmImport() {
    logger.info('Confirming final import');

    // Wait for "Ready to import" text to ensure page is loaded
    await this.page.waitForSelector('text=Ready to import');

    // Click the Import File button
    await this.page.click('button:has-text("Import File")');

    logger.info('Import process initiated');
  }

  async waitForCompletion() {
    logger.info('Waiting for import completion...');

    try {
      // Wait for success indicators or navigation back to import history
      await Promise.race([
        this.page.waitForSelector('text=completed', { timeout: 60000 }),
        this.page.waitForSelector('text=success', { timeout: 60000 }),
        this.page.waitForNavigation({ timeout: 60000 })
      ]);

      logger.info('✅ Import completed successfully');
      return true;
    } catch (error) {
      logger.error('Import completion check timed out:', error);
      return false;
    }
  }
}

module.exports = ImportConfirmationPage;