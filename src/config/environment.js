require('dotenv').config();

const config = {
  baseUrl: process.env.BASE_URL || 'https://dev.schedule.checkfirst.ai',
  username: process.env.USERNAME,
  password: process.env.PASSWORD,
  csvFilePath: process.env.CSV_FILE_PATH || './data/schemes-template.csv',
  importType: process.env.IMPORT_TYPE || 'schemes',
  headless: process.env.HEADLESS === 'true',
  screenshotOnError: process.env.SCREENSHOT_ON_ERROR !== 'false', // Default to true
  logLevel: process.env.LOG_LEVEL || 'info',
  timeouts: {
    browser: parseInt(process.env.BROWSER_TIMEOUT) || 30000,
    navigation: parseInt(process.env.NAVIGATION_TIMEOUT) || 10000,
    fileUpload: parseInt(process.env.FILE_UPLOAD_TIMEOUT) || 60000,
    validation: parseInt(process.env.VALIDATION_TIMEOUT) || 15000,
    importCompletion: parseInt(process.env.IMPORT_COMPLETION_TIMEOUT) || 120000
  },
  retries: {
    maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
    retryDelay: parseInt(process.env.RETRY_DELAY) || 1000
  }
};

// Comprehensive validation
function validateConfig() {
  const errors = [];

  // Required fields
  const requiredFields = ['username', 'password'];
  for (const field of requiredFields) {
    if (!config[field]) {
      errors.push(`Missing required environment variable: ${field.toUpperCase()}`);
    }
  }

  // Validate URLs
  if (config.baseUrl) {
    try {
      new URL(config.baseUrl);
    } catch (e) {
      errors.push(`Invalid BASE_URL format: ${config.baseUrl}`);
    }
  }

  // Validate import type
  const validImportTypes = ['schemes', 'projects', 'inspectors'];
  if (!validImportTypes.includes(config.importType)) {
    errors.push(`Invalid IMPORT_TYPE: ${config.importType}. Must be one of: ${validImportTypes.join(', ')}`);
  }

  // Validate log level
  const validLogLevels = ['error', 'warn', 'info', 'debug'];
  if (!validLogLevels.includes(config.logLevel)) {
    errors.push(`Invalid LOG_LEVEL: ${config.logLevel}. Must be one of: ${validLogLevels.join(', ')}`);
  }

  // Validate timeout values
  const timeoutFields = Object.keys(config.timeouts);
  for (const field of timeoutFields) {
    const value = config.timeouts[field];
    if (isNaN(value) || value <= 0) {
      errors.push(`Invalid timeout value for ${field}: ${value}. Must be a positive number.`);
    }
  }

  // Validate retry values
  if (config.retries.maxRetries < 1 || config.retries.maxRetries > 10) {
    errors.push(`Invalid MAX_RETRIES: ${config.retries.maxRetries}. Must be between 1 and 10.`);
  }

  if (config.retries.retryDelay < 100 || config.retries.retryDelay > 10000) {
    errors.push(`Invalid RETRY_DELAY: ${config.retries.retryDelay}. Must be between 100 and 10000 ms.`);
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`);
  }
}

validateConfig();

module.exports = config;
