const SELECTORS = {
  LOGIN: {
    EMAIL_INPUT: 'input[type="email"], input[name="email"], input[placeholder*="email" i]',
    PASSWORD_INPUT: 'input[type="password"], input[name="password"], input[placeholder*="password" i]',
    SIGN_IN_BUTTON: 'button[type="submit"], button:text("Sign in"), xpath=//button[contains(text(), "Sign in")]'
  },
  
  IMPORT: {
    IMPORT_BUTTON: 'button.MuiButton-contained:has-text("Import"), button[role="button"]:has-text("Import"), button:has-text("Import"), a:has-text("Import")',
    NEXT_BUTTON: 'button:has-text("Next"), button.MuiButton-contained:has-text("Next")',
    FILE_TYPE_MODAL: 'text=Select the file type',
    RADIO_BUTTON: (type) => `input[type="radio"][value="${type}"], label:has-text("${type}") input[type="radio"]`
  },
  
  FILE_UPLOAD: {
    DROP_ZONE: 'text=Drop or select file',
    FILE_INPUT: 'input[type="file"]',
    REMOVE_FILE: 'text=Remove file'
  },
  
  PREVIEW: {
    VALIDATION_SUCCESS: 'text=All data is valid and ready to import',
    ERROR_INDICATORS: '[class*="error"], [class*="invalid"], text=error'
  },
  
  CONFIRMATION: {
    READY_TEXT: 'text=Ready to import',
    IMPORT_FILE_BUTTON: 'button:has-text("Import File")',
    COMPLETION_INDICATORS: 'text=completed, text=success'
  }
};

module.exports = SELECTORS;