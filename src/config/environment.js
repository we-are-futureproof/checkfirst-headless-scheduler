require('dotenv').config();

const config = {
  baseUrl: process.env.BASE_URL || 'https://dev.schedule.checkfirst.ai',
  username: process.env.USERNAME,
  password: process.env.PASSWORD,
  csvFilePath: process.env.CSV_FILE_PATH || './data/schemes-template.csv',
  importType: process.env.IMPORT_TYPE || 'schemes',
  headless: process.env.HEADLESS === 'true',
  screenshotOnError: process.env.SCREENSHOT_ON_ERROR === 'true',
  logLevel: process.env.LOG_LEVEL || 'info',
  timeouts: {
    browser: parseInt(process.env.BROWSER_TIMEOUT) || 30000,
    navigation: parseInt(process.env.NAVIGATION_TIMEOUT) || 10000
  }
};

// Validate required config
const requiredFields = ['username', 'password'];
for (const field of requiredFields) {
  if (!config[field]) {
    throw new Error(`Missing required environment variable: ${field.toUpperCase()}`);
  }
}

module.exports = config;
