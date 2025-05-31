const config = require('./config/environment');
const logger = require('./utils/logger');
const BrowserManager = require('./utils/browser');
const FileHelpers = require('./utils/fileHelpers');

// Page Objects
const LoginPage = require('./pages/LoginPage');
const ImportHistoryPage = require('./pages/ImportHistoryPage');
const FileUploadPage = require('./pages/FileUploadPage');
const PreviewPage = require('./pages/PreviewPage');
const ImportConfirmationPage = require('./pages/ImportConfirmationPage');

class CSVImportAutomation {
  constructor() {
    this.browserManager = new BrowserManager();
    this.page = null;
  }

  async run() {
    try {
      logger.info('🚀 Starting CSV Import Automation');
      logger.info(`Configuration: ${JSON.stringify({
        baseUrl: config.baseUrl,
        username: config.username,
        importType: config.importType,
        csvFile: config.csvFilePath
      }, null, 2)}`);

      // Setup
      await this.setup();

      // Execute import workflow
      await this.executeImportWorkflow();

      logger.info('✅ CSV Import Automation completed successfully');

    } catch (error) {
      logger.error('❌ CSV Import Automation failed:', error);

      if (config.screenshotOnError) {
        await this.browserManager.takeScreenshot('error');
      }

      throw error;
    } finally {
      await this.cleanup();
    }
  }

  async setup() {
    // Ensure required directories exist
    FileHelpers.ensureDirectoryExists('logs');
    FileHelpers.ensureDirectoryExists('screenshots');

    // Validate CSV file with expected headers
    const expectedHeaders = FileHelpers.getExpectedHeadersForImportType(config.importType);
    const csvValidation = FileHelpers.validateCsvFile(config.csvFilePath, expectedHeaders);
    
    logger.info(`✅ CSV validation complete: ${csvValidation.lineCount} lines, headers: ${csvValidation.headers.join(', ')}`);

    // Initialize browser
    this.page = await this.browserManager.initialize();
  }

  async executeImportWorkflow() {
    // Step 1: Login
    const loginPage = new LoginPage(this.page);
    await loginPage.navigate(config.baseUrl);
    await loginPage.login(config.username, config.password);
    await this.browserManager.takeScreenshot('01-login-complete');

    // Step 2: Navigate to Import and Select Type
    const importHistoryPage = new ImportHistoryPage(this.page);
    await importHistoryPage.navigateToImport();
    await importHistoryPage.selectImportType(config.importType);
    await this.browserManager.takeScreenshot('02-import-type-selected');

    // Step 3: Upload File
    const fileUploadPage = new FileUploadPage(this.page);
    await fileUploadPage.uploadFile(config.csvFilePath);
    await fileUploadPage.proceedToPreview();
    await this.browserManager.takeScreenshot('03-file-uploaded');

    // Step 4: Validate Data
    const previewPage = new PreviewPage(this.page);
    const isDataValid = await previewPage.validateDataReadiness();

    if (!isDataValid) {
      throw new Error('Data validation failed - manual intervention required');
    }

    await previewPage.proceedToFinalStep();
    await this.browserManager.takeScreenshot('04-data-validated');

    // Step 5: Confirm Import
    const importConfirmationPage = new ImportConfirmationPage(this.page);
    await importConfirmationPage.confirmImport();
    await this.browserManager.takeScreenshot('05-import-initiated');

    // Step 6: Wait for Completion
    const success = await importConfirmationPage.waitForCompletion();
    if (success) {
      await this.browserManager.takeScreenshot('06-import-completed');
    }
  }

  async cleanup() {
    await this.browserManager.close();
  }
}


// Run the automation
async function main() {
  const automation = new CSVImportAutomation();

  try {
    await automation.run();
    process.exit(0);
  } catch (error) {
    logger.error('Automation failed:', error);
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--dry-run')) {
  logger.info('Dry run mode - validating configuration only');
  logger.info('Configuration valid ✅');
  process.exit(0);
} else {
  main();
}

module.exports = CSVImportAutomation;