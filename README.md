# CSV Import Automation

Automated CSV file import system using Puppeteer for the CheckFirst scheduling application.

## 🎯 Purpose

This automation handles the complete CSV import workflow:
1. Login to the application
2. Navigate to import section
3. Select import type (schemes, projects, inspectors)
4. Upload CSV file
5. Validate data integrity
6. Complete import process

## 📁 Project Structure

```
puppeteer-csv-import/
├── src/
│   ├── config/
│   │   └── environment.js          # Environment configuration
│   ├── pages/                      # Page Object Model classes
│   │   ├── LoginPage.js
│   │   ├── ImportHistoryPage.js
│   │   ├── FileUploadPage.js
│   │   ├── PreviewPage.js
│   │   └── ImportConfirmationPage.js
│   ├── utils/                      # Utility classes
│   │   ├── browser.js              # Browser management
│   │   ├── logger.js               # Logging configuration
│   │   └── fileHelpers.js          # File operations
│   └── main.js                     # Main automation script
├── data/                           # CSV files for import
│   └── schemes-template.csv
├── logs/                           # Application logs
├── screenshots/                    # Debug screenshots
├── .env                           # Environment variables (DO NOT COMMIT)
├── .env.example                   # Environment template
├── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ installed
- Chrome/Chromium browser
- Access to CheckFirst application

### Installation

1. **Clone/Download the project**
   ```bash
   git clone <repository-url>
   cd puppeteer-csv-import
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your credentials:
   ```env
   BASE_URL=https://dev.schedule.checkfirst.ai
   USERNAME=sherif+demo-13@checkfirst.ai
   PASSWORD=123456
   CSV_FILE_PATH=./data/schemes-template.csv
   IMPORT_TYPE=schemes
   HEADLESS=false
   ```

4. **Add your CSV file**
   ```bash
   # Place your CSV file in the data/ directory
   cp your-file.csv data/schemes-template.csv
   ```

5. **Run the automation**
   ```bash
   npm start
   ```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `BASE_URL` | Application base URL | `https://dev.schedule.checkfirst.ai` | ✅ |
| `USERNAME` | Login email | - | ✅ |
| `PASSWORD` | Login password | - | ✅ |
| `CSV_FILE_PATH` | Path to CSV file | `./data/schemes-template.csv` | ✅ |
| `IMPORT_TYPE` | Type of import (schemes/projects/inspectors) | `schemes` | ✅ |
| `HEADLESS` | Run browser in headless mode | `false` | ❌ |
| `SCREENSHOT_ON_ERROR` | Take screenshots on errors | `true` | ❌ |
| `LOG_LEVEL` | Logging level (error/warn/info/debug) | `info` | ❌ |
| `BROWSER_TIMEOUT` | Browser operation timeout (ms) | `30000` | ❌ |
| `NAVIGATION_TIMEOUT` | Page navigation timeout (ms) | `10000` | ❌ |

### Import Types

- `schemes` - Import scheme data
- `projects` - Import project data
- `inspectors` - Import inspector data

## 🎮 Usage

### Basic Usage
```bash
npm start
```
*Uses manual authentication: fills credentials automatically, pauses for you to click sign-in, then continues automation*

### Other Commands
```bash
npm run dev                # Development mode with debugging  
npm test                   # Dry run (config validation only)
npm run debug              # Captures HTML for selector analysis
```

### Custom CSV File
```bash
CSV_FILE_PATH=./data/my-custom-file.csv npm start
```

## 📊 Monitoring & Debugging

### Logs
- **Console output**: Real-time progress
- **logs/combined.log**: All log entries
- **logs/error.log**: Error entries only

### Screenshots
- Automatically taken at each major step
- Error screenshots when `SCREENSHOT_ON_ERROR=true`
- Stored in `screenshots/` directory

### Common Issues

**Login fails**
- Verify credentials in `.env`
- Check if account is locked
- Ensure base URL is correct
- **Note**: The system uses manual authentication by default to handle anti-automation protection

**File upload fails**
- Verify CSV file exists and is readable
- Check file format matches expected template
- Ensure file is not empty

**Data validation fails**
- Review CSV data for errors
- Download template from application
- Manual intervention required for data issues

**Timeout errors**
- Increase timeout values in `.env`
- Check network connectivity
- Verify application is responsive

## 🔧 Development

### Adding New Import Types

1. **Update environment config** (`src/config/environment.js`)
2. **Modify import type selection** (`src/pages/ImportHistoryPage.js`)
3. **Test with new CSV format**

### Extending Validation Logic

Edit `src/pages/PreviewPage.js`:
```javascript
async validateDataReadiness() {
  // Add custom validation logic
  const customCheck = await this.page.$('your-custom-selector');
  // Return true/false based on validation
}
```

### Adding Error Recovery

Modify page classes to include retry logic:
```javascript
async performActionWithRetry(action, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await action();
      return;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await this.page.waitForTimeout(1000);
    }
  }
}
```

## 🏗️ Architecture

### Page Object Model
Each page interaction is encapsulated in its own class:
- **Separation of concerns**: Each page handles its own logic
- **Reusability**: Page methods can be reused across tests
- **Maintainability**: Changes to UI only affect one file

### Error Handling Strategy
- **Graceful degradation**: Continue where possible
- **Detailed logging**: Comprehensive error information
- **Visual debugging**: Screenshots for troubleshooting
- **Timeout management**: Configurable timeouts for different operations

### Modular Design
- **Configuration centralized**: Single source of truth
- **Utilities separated**: Reusable helper functions
- **Clean interfaces**: Clear method signatures and responsibilities

## 🤝 Handoff Notes

### For Junior Developers

**Key concepts to understand:**
1. **Page Object Model**: Each page = one class
2. **Async/Await**: All Puppeteer operations are asynchronous
3. **CSS Selectors**: How to find elements on pages
4. **Environment Configuration**: Externalized settings

**Common modifications:**
- Adding new selectors when UI changes
- Adjusting timeouts for slower environments
- Adding new validation checks
- Extending logging for debugging

**Testing approach:**
- Run with `HEADLESS=false` to see browser actions
- Use screenshots to debug failing steps
- Check logs for detailed error information
- Test with different CSV files

**Integration tips:**
- All configuration in `.env` file
- Modular design allows easy integration
- Logger can be extended for your monitoring system
- Screenshot functionality useful for reporting

## 📝 License

MIT License - feel free to modify and distribute.

## 🆘 Support

For issues or questions:
1. Check logs in `logs/` directory
2. Review screenshots in `screenshots/` directory
3. Verify configuration in `.env` file
4. Test with a minimal CSV file first