class AutomationError extends Error {
  constructor(message, step, context = {}) {
    super(message);
    this.name = 'AutomationError';
    this.step = step;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }

  toString() {
    return `${this.name} [${this.step}]: ${this.message}`;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      step: this.step,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

class LoginError extends AutomationError {
  constructor(message, context) {
    super(message, 'LOGIN', context);
    this.name = 'LoginError';
  }
}

class FileUploadError extends AutomationError {
  constructor(message, context) {
    super(message, 'FILE_UPLOAD', context);
    this.name = 'FileUploadError';
  }
}

class ValidationError extends AutomationError {
  constructor(message, context) {
    super(message, 'VALIDATION', context);
    this.name = 'ValidationError';
  }
}

class ImportError extends AutomationError {
  constructor(message, context) {
    super(message, 'IMPORT', context);
    this.name = 'ImportError';
  }
}

module.exports = {
  AutomationError,
  LoginError,
  FileUploadError,
  ValidationError,
  ImportError
};