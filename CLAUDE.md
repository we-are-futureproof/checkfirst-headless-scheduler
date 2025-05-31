# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

- **Start automation**: `npm start` (uses manual authentication by default)
- **Development with debugging**: `npm run dev`
- **Debug mode (HTML capture)**: `npm run debug`
- **Dry run (config validation)**: `npm test`
- **Install dependencies**: `npm install` or `pnpm install`

## Architecture Overview

This is a Puppeteer-based CSV import automation system for the CheckFirst scheduling application. It follows a **Page Object Model** pattern with enhanced error handling and retry mechanisms:

### Core Components

- **`src/main.js`**: Main orchestrator class (`CSVImportAutomation`) that coordinates the entire workflow
- **`src/config/environment.js`**: Centralized configuration management with comprehensive validation
- **`src/utils/browser.js`**: Browser lifecycle management with request interception and screenshot capabilities
- **`src/utils/BasePageObject.js`**: Base class providing retry logic, error handling, and common page operations
- **`src/utils/ManualIntervention.js`**: Manual intervention system for authentication challenges
- **`src/pages/`**: Page Object Model classes extending BasePageObject for specific UI interactions
- **`src/errors/AutomationError.js`**: Custom error types with context and step information
- **`src/constants/`**: Centralized selectors and messages for maintainability

### Workflow Architecture

The automation follows a 6-step linear workflow:
1. Login → 2. Navigate to Import → 3. Upload File → 4. Validate Data → 5. Confirm Import → 6. Wait for Completion

Each step includes automatic retry logic, enhanced error context, and operation timing.

### Key Design Patterns

- **Page Object Model with Inheritance**: All pages extend BasePageObject for common functionality
- **Retry-First Architecture**: All operations include automatic retry with exponential backoff
- **Enhanced Error Handling**: Custom error types with step context and screenshot capture
- **Configuration-driven with Validation**: Comprehensive config validation with specific error messages
- **CSV Validation**: Header validation and format checking before upload
- **Centralized Constants**: Selectors and messages in separate files for maintainability

### Enhanced Features

- **Manual Authentication Mode**: Handles anti-automation auth systems with user intervention
- **Automatic Retry Logic**: 3 retry attempts with exponential backoff for transient failures
- **CSV Header Validation**: Validates expected headers based on import type before upload
- **HTML Debug Capture**: Captures page HTML for selector debugging when enabled
- **Operation Timing**: Logs execution time for each operation for performance monitoring
- **Enhanced Error Context**: Errors include step information, screenshots, and detailed context
- **Improved Timeout Management**: Different timeouts for different operation types

### Environment Configuration

Extended configuration with operation-specific timeouts and retry settings:
- **Required**: `BASE_URL`, `USERNAME`, `PASSWORD`
- **File & Import**: `CSV_FILE_PATH`, `IMPORT_TYPE`
- **Behavior**: `HEADLESS` (defaults to false for manual auth), `SCREENSHOT_ON_ERROR`
- **Debug**: `DEBUG_HTML=true` (captures HTML for selector analysis)
- **Timeouts**: `BROWSER_TIMEOUT`, `NAVIGATION_TIMEOUT`, `FILE_UPLOAD_TIMEOUT`, `VALIDATION_TIMEOUT`, `IMPORT_COMPLETION_TIMEOUT`
- **Retry Settings**: `MAX_RETRIES`, `RETRY_DELAY`

### Authentication Handling

The system uses **manual authentication by default**:
- **Default Behavior**: Fills credentials automatically, then pauses for user to complete sign-in manually
- **Why Manual**: Many authentication systems (Auth0, Okta) block automation, so manual intervention is the most reliable approach
- **Debug Mode**: `DEBUG_HTML=true` - Captures HTML for selector debugging

### File Structure Context

- `data/`: Contains CSV files for import (templates and actual data)
- `logs/`: Winston-based logging output (combined.log, error.log)
- `screenshots/`: Debug screenshots with timestamps and error context
- `src/errors/`: Custom error classes with enhanced context
- `src/constants/`: Centralized selectors and messages
- Page classes handle specific UI flows with automatic retry and error handling