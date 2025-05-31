const logger = require('../utils/logger');

class PreviewPage {
  constructor(page) {
    this.page = page;
  }

  async validateDataReadiness() {
    logger.info('Validating data readiness for import');

    // Wait for the validation message
    try {
      await this.page.waitForSelector('text=All data is valid and ready to import', { timeout: 15000 });
      logger.info('✅ Data validation successful - ready to import');
      return true;
    } catch (error) {
      logger.warn('❌ Data validation failed - manual intervention required');

      // Look for error indicators
      const errorElements = await this.page.$$('[class*="error"], [class*="invalid"], text=error');
      if (errorElements.length > 0) {
        logger.error('Validation errors found - stopping automation');
        return false;
      }

      throw new Error('Data validation check timed out');
    }
  }

  async proceedToFinalStep() {
    logger.info('Proceeding to final import step');

    // Click Next button to go to final import confirmation
    await this.page.click('button:has-text("Next")');

    logger.info('Navigated to final import confirmation');
  }
}

module.exports = PreviewPage;