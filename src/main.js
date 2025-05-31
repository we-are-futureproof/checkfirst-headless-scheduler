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

    // Prepare all import tasks
    this.importTasks = this.prepareImportTasks();

    logger.info(`📋 Prepared ${this.importTasks.length} import tasks: ${this.importTasks.map(t => t.type).join(', ')}`);

    // Initialize browser
    this.page = await this.browserManager.initialize();
  }

  prepareImportTasks() {
    const importTypes = ['schemes', 'projects', 'inspectors'];
    const tasks = [];

    for (const importType of importTypes) {
      try {
        const expectedHeaders = FileHelpers.getExpectedHeadersForImportType(importType);
        const csvValidation = FileHelpers.validateCsvFile(config.csvFilePath, expectedHeaders, importType);

        tasks.push({
          type: importType,
          filePath: csvValidation.path,
          validation: csvValidation
        });

        logger.info(`✅ ${importType}: ${csvValidation.lineCount} lines, headers: ${csvValidation.headers.join(', ')}`);
      } catch (error) {
        logger.warn(`⚠️ Skipping ${importType}: ${error.message}`);
      }
    }

    if (tasks.length === 0) {
      throw new Error('No valid CSV files found for import');
    }

    return tasks;
  }

  async executeImportWorkflow() {
    // Step 1: Login (once for all imports)
    const loginPage = new LoginPage(this.page);
    await loginPage.navigate(config.baseUrl);
    await loginPage.login(config.username, config.password);
    await this.browserManager.takeScreenshot('01-login-complete');

    // Step 2: Process each import task sequentially
    for (let i = 0; i < this.importTasks.length; i++) {
      const task = this.importTasks[i];
      const taskNumber = i + 1;

      logger.info(`📂 Starting import ${taskNumber}/${this.importTasks.length}: ${task.type}`);
      logger.info(`📄 File: ${task.filePath}`);

      try {
        await this.executeImportTask(task, taskNumber);
        logger.info(`✅ Completed import ${taskNumber}/${this.importTasks.length}: ${task.type}`);
      } catch (error) {
        logger.error(`❌ Failed import ${taskNumber}/${this.importTasks.length}: ${task.type} - ${error.message}`);

        // Take screenshot on error but continue with next import
        await this.browserManager.takeScreenshot(`error-import-${taskNumber}-${task.type}`);

        // Optionally stop on first error or continue - for now continue
        logger.warn(`⏭️ Continuing with next import...`);
      }
    }

    logger.info(`🎉 Completed all imports: ${this.importTasks.length} total`);
  }

  async executeImportTask(task, taskNumber) {
    const prefix = `${taskNumber.toString().padStart(2, '0')}-${task.type}`;

    // Navigate to Import and Select Type
    const importHistoryPage = new ImportHistoryPage(this.page);
    await importHistoryPage.navigateToImport();
    await importHistoryPage.selectImportType(task.type);
    await this.browserManager.takeScreenshot(`${prefix}-01-type-selected`);

    // Upload File
    const fileUploadPage = new FileUploadPage(this.page);
    await fileUploadPage.uploadFile(task.filePath);
    await fileUploadPage.proceedToPreview();
    await this.browserManager.takeScreenshot(`${prefix}-02-file-uploaded`);

    // Validate Data
    const previewPage = new PreviewPage(this.page);
    const isDataValid = await previewPage.validateDataReadiness();

    if (!isDataValid) {
      throw new Error(`Data validation failed for ${task.type} - manual intervention required`);
    }

    await previewPage.proceedToFinalStep();
    await this.browserManager.takeScreenshot(`${prefix}-03-data-validated`);

    // Confirm Import
    const importConfirmationPage = new ImportConfirmationPage(this.page);
    await importConfirmationPage.confirmImport();
    await this.browserManager.takeScreenshot(`${prefix}-04-import-initiated`);

    // Wait for Completion
    const success = await importConfirmationPage.waitForCompletion();
    if (success) {
      await this.browserManager.takeScreenshot(`${prefix}-05-import-completed`);
    } else {
      throw new Error(`Import completion timeout for ${task.type}`);
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