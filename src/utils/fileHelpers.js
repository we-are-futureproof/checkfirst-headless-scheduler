const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const { ValidationError } = require('../errors/AutomationError');

class FileHelpers {
  static validateCsvFile(filePath, expectedHeaders = null) {
    try {
      const absolutePath = path.resolve(filePath);

      if (!fs.existsSync(absolutePath)) {
        throw new ValidationError(
          `CSV file not found: ${absolutePath}`,
          { filePath: absolutePath, step: 'file_existence' }
        );
      }

      const stats = fs.statSync(absolutePath);
      if (stats.size === 0) {
        throw new ValidationError(
          `CSV file is empty: ${absolutePath}`,
          { filePath: absolutePath, size: stats.size }
        );
      }

      // Read and validate CSV content
      const content = fs.readFileSync(absolutePath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim().length > 0);

      if (lines.length === 0) {
        throw new ValidationError(
          `CSV file contains no data: ${absolutePath}`,
          { filePath: absolutePath, lines: lines.length }
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
              filePath: absolutePath,
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
          `CSV file must contain at least one data row: ${absolutePath}`,
          { filePath: absolutePath, totalLines: lines.length }
        );
      }

      logger.info(`✅ CSV file validated: ${absolutePath} (${stats.size} bytes, ${lines.length} lines)`);

      return {
        path: absolutePath,
        size: stats.size,
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