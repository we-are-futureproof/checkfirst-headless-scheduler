const logger = require('../utils/logger');

class FileUploadPage {
  constructor(page) {
    this.page = page;
  }

  async uploadFile(filePath) {
    logger.info(`Uploading file: ${filePath}`);

    // Wait for the upload area
    await this.page.waitForSelector('text=Drop or select file');

    // Find the file input element (it might be hidden)
    const fileInput = await this.page.$('input[type="file"]');

    if (fileInput) {
      // Direct file input approach
      await fileInput.uploadFile(filePath);
    } else {
      // Click the upload area to trigger file dialog
      await this.page.click('text=Drop or select file');

      // Wait for file input to appear and upload
      await this.page.waitForSelector('input[type="file"]');
      const input = await this.page.$('input[type="file"]');
      await input.uploadFile(filePath);
    }

    // Confirm file was uploaded by looking for "Remove file" text
    await this.page.waitForSelector('text=Remove file', { timeout: 10000 });
    logger.info('File uploaded successfully - confirmed by "Remove file" text');
  }

  async proceedToPreview() {
    logger.info('Proceeding to preview step');

    // Click Next button to go to preview
    await this.page.click('button:has-text("Next")');

    logger.info('Navigated to preview step');
  }
}

module.exports = FileUploadPage;