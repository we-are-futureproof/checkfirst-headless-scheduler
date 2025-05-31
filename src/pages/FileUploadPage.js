const BasePageObject = require('../utils/BasePageObject');
const SELECTORS = require('../constants/selectors');
const MESSAGES = require('../constants/messages');
const { FileUploadError } = require('../errors/AutomationError');
const config = require('../config/environment');
const logger = require('../utils/logger');

class FileUploadPage extends BasePageObject {
  constructor(page) {
    super(page);
  }

  async uploadFile(filePath) {
    logger.info(MESSAGES.FILE_UPLOAD.UPLOADING(filePath));

    try {
      // Wait for the upload area with retry
      await this.waitForElementWithValidation(SELECTORS.FILE_UPLOAD.DROP_ZONE, {
        operationName: 'wait for upload area',
        timeout: config.timeouts.fileUpload
      });

      // Try direct file input approach first
      await this.retryOperation(async () => {
        let fileInput = await this.page.$(SELECTORS.FILE_UPLOAD.FILE_INPUT);

        if (fileInput) {
          // Direct file input approach
          await fileInput.uploadFile(filePath);
        } else {
          // Click the upload area to trigger file dialog
          await this.page.click(SELECTORS.FILE_UPLOAD.DROP_ZONE);

          // Wait for file input to appear and upload
          await this.page.waitForSelector(SELECTORS.FILE_UPLOAD.FILE_INPUT, { 
            timeout: 5000 
          });
          const input = await this.page.$(SELECTORS.FILE_UPLOAD.FILE_INPUT);
          await input.uploadFile(filePath);
        }
      }, 3, 2000, 'file upload');

      // Confirm file was uploaded by looking for "Remove file" text
      await this.waitForElementWithValidation(SELECTORS.FILE_UPLOAD.REMOVE_FILE, {
        operationName: 'confirm file upload',
        timeout: config.timeouts.fileUpload
      });
      
      logger.info(MESSAGES.FILE_UPLOAD.SUCCESS);
    } catch (error) {
      const screenshot = await this.takeScreenshot('file-upload-error', { filePath });
      throw new FileUploadError(
        `File upload failed: ${error.message}`,
        { filePath, screenshot, originalError: error.message }
      );
    }
  }

  async proceedToPreview() {
    logger.info(MESSAGES.FILE_UPLOAD.PROCEEDING);

    try {
      // Click Next button to go to preview with retry
      await this.clickWithRetry(SELECTORS.IMPORT.NEXT_BUTTON, {
        operationName: 'proceed to preview'
      });

      logger.info(MESSAGES.FILE_UPLOAD.NAVIGATED);
    } catch (error) {
      const screenshot = await this.takeScreenshot('proceed-to-preview-error');
      throw new FileUploadError(
        `Failed to proceed to preview: ${error.message}`,
        { screenshot, originalError: error.message }
      );
    }
  }
}

module.exports = FileUploadPage;