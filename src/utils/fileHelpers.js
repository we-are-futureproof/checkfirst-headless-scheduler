const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class FileHelpers {
  static validateCsvFile(filePath) {
    try {
      const absolutePath = path.resolve(filePath);

      if (!fs.existsSync(absolutePath)) {
        throw new Error(`CSV file not found: ${absolutePath}`);
      }

      const stats = fs.statSync(absolutePath);
      if (stats.size === 0) {
        throw new Error(`CSV file is empty: ${absolutePath}`);
      }

      logger.info(`CSV file validated: ${absolutePath} (${stats.size} bytes)`);
      return absolutePath;
    } catch (error) {
      logger.error('CSV file validation failed:', error);
      throw error;
    }
  }

  static ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      logger.info(`Created directory: ${dirPath}`);
    }
  }
}

module.exports = FileHelpers;