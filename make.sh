#!/bin/bash

# Create all directories
mkdir -p src/config
mkdir -p src/pages
mkdir -p src/utils
mkdir -p data
mkdir -p logs
mkdir -p screenshots

# Create all files
touch src/config/environment.js
touch src/pages/LoginPage.js
touch src/pages/ImportHistoryPage.js
touch src/pages/FileUploadPage.js
touch src/pages/PreviewPage.js
touch src/pages/ImportConfirmationPage.js
touch src/utils/browser.js
touch src/utils/logger.js
touch src/utils/fileHelpers.js
touch src/main.js
touch data/schemes-template.csv
touch .env
touch .env.example
touch package.json
touch README.md

echo "✅ Project structure created successfully!"