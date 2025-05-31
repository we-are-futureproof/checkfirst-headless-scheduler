# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

- **Start automation**: `npm start`
- **Development with debugging**: `npm run dev`
- **Dry run (config validation)**: `npm test`
- **Install dependencies**: `npm install` or `pnpm install`

## Architecture Overview

This is a Puppeteer-based CSV import automation system for the CheckFirst scheduling application. It follows a **Page Object Model** pattern with clear separation of concerns:

### Core Components

- **`src/main.js`**: Main orchestrator class (`CSVImportAutomation`) that coordinates the entire workflow
- **`src/config/environment.js`**: Centralized configuration management with environment variable validation
- **`src/utils/browser.js`**: Browser lifecycle management with request interception and screenshot capabilities
- **`src/pages/`**: Page Object Model classes, each handling specific UI interactions for their respective pages

### Workflow Architecture

The automation follows a 6-step linear workflow:
1. Login → 2. Navigate to Import → 3. Upload File → 4. Validate Data → 5. Confirm Import → 6. Wait for Completion

Each step is encapsulated in its own page class and includes screenshot capture for debugging.

### Key Design Patterns

- **Page Object Model**: Each page interaction is isolated in its own class with clear responsibilities
- **Configuration-driven**: All settings externalized to environment variables with validation
- **Error handling with visual debugging**: Screenshots taken at each step and on errors
- **Resource optimization**: CSS and fonts blocked during automation for performance

### Environment Configuration

All runtime configuration is managed through `.env` file with these key variables:
- `BASE_URL`, `USERNAME`, `PASSWORD` (required)
- `CSV_FILE_PATH`, `IMPORT_TYPE` (defaults provided)
- `HEADLESS`, `SCREENSHOT_ON_ERROR` (optional)
- Timeout configurations for browser and navigation operations

### File Structure Context

- `data/`: Contains CSV files for import (templates and actual data)
- `logs/`: Winston-based logging output (combined.log, error.log)
- `screenshots/`: Debug screenshots with timestamps
- Page classes handle specific UI flows: Login → ImportHistory → FileUpload → Preview → ImportConfirmation