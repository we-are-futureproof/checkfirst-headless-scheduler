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
      'schemes': ['name', 'description', 'code'],
      'projects': ['name', 'description', 'start_date', 'end_date'],
      'inspectors': ['name', 'email', 'certification']
    };
    
    return headerMappings[importType] || [];
  }
}

module.exports = FileHelpers;