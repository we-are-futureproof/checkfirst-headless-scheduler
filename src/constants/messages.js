const MESSAGES = {
  LOGIN: {
    NAVIGATING: (url) => `Navigating to login page: ${url}`,
    PAGE_LOADED: 'Login page loaded successfully',
    ATTEMPTING: (username) => `Attempting login for user: ${username}`,
    SUCCESS: 'Login completed successfully',
    FAILED: 'Login failed'
  },
  
  IMPORT: {
    NAVIGATING: 'Navigating to import section',
    CLICKED_IMPORT: 'Clicked Import button',
    SELECTING_TYPE: (type) => `Selecting import type: ${type}`,
    TYPE_SELECTED: (type) => `Selected import type: ${type}`
  },
  
  FILE_UPLOAD: {
    UPLOADING: (path) => `Uploading file: ${path}`,
    SUCCESS: 'File uploaded successfully - confirmed by "Remove file" text',
    PROCEEDING: 'Proceeding to preview step',
    NAVIGATED: 'Navigated to preview step'
  },
  
  VALIDATION: {
    VALIDATING: 'Validating data readiness for import',
    SUCCESS: '✅ Data validation successful - ready to import',
    FAILED: '❌ Data validation failed - manual intervention required',
    ERRORS_FOUND: 'Validation errors found - stopping automation',
    TIMEOUT: 'Data validation check timed out',
    PROCEEDING: 'Proceeding to final import step',
    NAVIGATED: 'Navigated to final import confirmation'
  },
  
  CONFIRMATION: {
    CONFIRMING: 'Confirming final import',
    INITIATED: 'Import process initiated',
    WAITING: 'Waiting for import completion...',
    SUCCESS: '✅ Import completed successfully',
    TIMEOUT: 'Import completion check timed out'
  },
  
  GENERAL: {
    STARTING: '🚀 Starting CSV Import Automation',
    SUCCESS: '✅ CSV Import Automation completed successfully',
    FAILED: '❌ CSV Import Automation failed'
  }
};

module.exports = MESSAGES;