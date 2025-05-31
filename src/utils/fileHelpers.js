const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const { ValidationError } = require('../errors/AutomationError');

class FileHelpers {
  static validateCsvFile(filePath, expectedHeaders = null, importType = null) {
    try {
      const absolutePath = path.resolve(filePath);

      if (!fs.existsSync(absolutePath)) {
        throw new ValidationError(
          `CSV file or directory not found: ${absolutePath}`,
          { filePath: absolutePath, step: 'file_existence' }
        );
      }

      const stats = fs.statSync(absolutePath);
      let actualFilePath = absolutePath;

      // If it's a directory, find the appropriate CSV file
      if (stats.isDirectory()) {
        actualFilePath = this.findCsvFileInDirectory(absolutePath, importType);

        if (!actualFilePath) {
          throw new ValidationError(
            `No suitable CSV file found in directory: ${absolutePath}`,
            {
              directory: absolutePath,
              importType,
              availableFiles: this.listCsvFilesInDirectory(absolutePath)
            }
          );
        }

        logger.info(`📁 Found CSV file: ${path.basename(actualFilePath)} for import type: ${importType}`);

        // Re-check the actual file
        const fileStats = fs.statSync(actualFilePath);
        if (fileStats.size === 0) {
          throw new ValidationError(
            `CSV file is empty: ${actualFilePath}`,
            { filePath: actualFilePath, size: fileStats.size }
          );
        }
      } else if (stats.size === 0) {
        throw new ValidationError(
          `CSV file is empty: ${absolutePath}`,
          { filePath: absolutePath, size: stats.size }
        );
      }

      // Read and validate CSV content using the actual file path
      const content = fs.readFileSync(actualFilePath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim().length > 0);

      if (lines.length === 0) {
        throw new ValidationError(
          `CSV file contains no data: ${actualFilePath}`,
          { filePath: actualFilePath, lines: lines.length }
        );
      }

      // Validate headers if expected headers are provided
      if (expectedHeaders && expectedHeaders.length > 0) {
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const normalizedExpected = expectedHeaders.map(h => h.toLowerCase());

        const missingHeaders = normalizedExpected.filter(expected =>
          !headers.some(header => header.includes(expected))
        );

        if (missingHeaders.length > 0) {
          throw new ValidationError(
            `CSV file missing required headers: ${missingHeaders.join(', ')}`,
            {
              filePath: actualFilePath,
              foundHeaders: headers,
              expectedHeaders: normalizedExpected,
              missingHeaders
            }
          );
        }
      }

      // Validate minimum number of data rows
      if (lines.length < 2) {
        throw new ValidationError(
          `CSV file must contain at least one data row: ${actualFilePath}`,
          { filePath: actualFilePath, totalLines: lines.length }
        );
      }

      const finalStats = fs.statSync(actualFilePath);
      logger.info(`✅ CSV file validated: ${actualFilePath} (${finalStats.size} bytes, ${lines.length} lines)`);

      return {
        path: actualFilePath,
        size: finalStats.size,
        lineCount: lines.length,
        headers: lines[0].split(',').map(h => h.trim())
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      logger.error('CSV file validation failed:', error);
      throw new ValidationError(
        `CSV file validation error: ${error.message}`,
        { originalError: error.message, filePath }
      );
    }
  }

  static ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      logger.info(`Created directory: ${dirPath}`);
    }
  }

  static findCsvFileInDirectory(directoryPath, importType) {
    try {
      const files = fs.readdirSync(directoryPath);
      const csvFiles = files.filter(file => file.toLowerCase().endsWith('.csv'));

      // First, try to find a file that matches the import type exactly
      const exactMatch = csvFiles.find(file =>
        file.toLowerCase().includes(importType.toLowerCase())
      );

      if (exactMatch) {
        return path.join(directoryPath, exactMatch);
      }

      // If no exact match, look for template files
      const templateMatch = csvFiles.find(file =>
        file.toLowerCase().includes('template') &&
        file.toLowerCase().includes(importType.toLowerCase())
      );

      if (templateMatch) {
        return path.join(directoryPath, templateMatch);
      }

      // If still no match, return the first CSV file found
      if (csvFiles.length > 0) {
        logger.warn(`⚠️ No ${importType} specific CSV found, using: ${csvFiles[0]}`);
        return path.join(directoryPath, csvFiles[0]);
      }

      return null;
    } catch (error) {
      logger.error('Error reading directory:', error);
      return null;
    }
  }

  static listCsvFilesInDirectory(directoryPath) {
    try {
      const files = fs.readdirSync(directoryPath);
      return files.filter(file => file.toLowerCase().endsWith('.csv'));
    } catch (error) {
      return [];
    }
  }

  static getExpectedHeadersForImportType(importType) {
    const headerMappings = {
      'schemes': ['name','category_name','periodicity','periodicity_type','rotation_after','rotation_after_type','window_size','window_size_type','code'],
      'projects': ['order_reference','priority','customer_name','country','due_date','postcodes','standard_codes','duration'],
      'inspectors': ['name','email','phone','address','city','postal_code','country','country_code','region','notes','location','type','role_name','days_capacity','days_capacity_period','travel_limit','competency_codes']

    };

    return headerMappings[importType] || [];
  }
}

module.exports = FileHelpers;