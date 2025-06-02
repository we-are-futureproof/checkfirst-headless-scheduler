#!/usr/bin/env node
/**
 * Verification script to ensure project setup is correct
 * Tests that all dependencies and configuration are properly set up
 */

const fs = require('fs');
const path = require('path');

// Determine if we're running from scripts/ folder or project root
const isInScriptsFolder = __dirname.endsWith('scripts');
const projectRoot = isInScriptsFolder ? path.join(__dirname, '..') : __dirname;

console.log('🔍 ScheduleAI Automation Setup Verification\n');

// Test 1: Check required files exist
const requiredFiles = [
  'package.json',
  '.env',
  'data/schemes-template.csv',
  'data/projects-template.csv', 
  'data/inspectors-template.csv',
  'src/config/environment.js',
  'scripts/fast-import-helper.js',
  'scripts/automated-data-validator.js',
  'scripts/record-pagination.js',
  'scripts/record-validation-flow.js',
  'scripts/verify-setup.js'
];

console.log('✅ Checking required files...');
let allFilesExist = true;
requiredFiles.forEach(file => {
  const fullPath = path.join(projectRoot, file);
  if (fs.existsSync(fullPath)) {
    console.log(`  ✓ ${file}`);
  } else {
    console.log(`  ✗ ${file} - MISSING`);
    allFilesExist = false;
  }
});

// Test 2: Check package.json scripts
console.log('\n✅ Checking package.json scripts...');
const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
const expectedScripts = ['fast', 'validate-data', 'record-pagination', 'record-validation', 'verify'];
expectedScripts.forEach(script => {
  if (packageJson.scripts[script]) {
    console.log(`  ✓ ${script}: ${packageJson.scripts[script]}`);
  } else {
    console.log(`  ✗ ${script} - MISSING`);
    allFilesExist = false;
  }
});

// Test 3: Check environment configuration
console.log('\n✅ Checking environment configuration...');
try {
  require('dotenv').config();
  const config = require(path.join(projectRoot, 'src/config/environment'));
  
  if (config.baseUrl) {
    console.log(`  ✓ BASE_URL: ${config.baseUrl}`);
  } else {
    console.log('  ✗ BASE_URL - MISSING');
    allFilesExist = false;
  }
  
  if (config.username) {
    console.log(`  ✓ USERNAME: ${config.username}`);
  } else {
    console.log('  ✗ USERNAME - MISSING');
    allFilesExist = false;
  }
  
  if (config.password) {
    console.log('  ✓ PASSWORD: [CONFIGURED]');
  } else {
    console.log('  ✗ PASSWORD - MISSING'); 
    allFilesExist = false;
  }
} catch (error) {
  console.log(`  ✗ Environment configuration error: ${error.message}`);
  allFilesExist = false;
}

// Test 4: Check CSV file content
console.log('\n✅ Checking CSV files have content...');
const csvFiles = [
  'data/schemes-template.csv',
  'data/projects-template.csv',
  'data/inspectors-template.csv'
];

csvFiles.forEach(file => {
  try {
    const content = fs.readFileSync(path.join(projectRoot, file), 'utf8');
    const lines = content.trim().split('\n');
    if (lines.length > 1) {
      console.log(`  ✓ ${file}: ${lines.length - 1} data rows`);
    } else {
      console.log(`  ✗ ${file}: Empty or header only`);
      allFilesExist = false;
    }
  } catch (error) {
    console.log(`  ✗ ${file}: Cannot read file`);
    allFilesExist = false;
  }
});

// Test 5: Verify script paths are correct (syntax check only)
console.log('\n✅ Checking script syntax...');
const { execSync } = require('child_process');
const scripts = [
  'scripts/fast-import-helper.js',
  'scripts/automated-data-validator.js'
];

scripts.forEach(script => {
  try {
    const scriptPath = path.join(projectRoot, script);
    execSync(`node -c ${scriptPath}`, { stdio: 'pipe' });
    console.log(`  ✓ ${script}: Syntax OK`);
  } catch (error) {
    console.log(`  ✗ ${script}: Syntax error`);
    allFilesExist = false;
  }
});

// Summary
console.log('\n' + '='.repeat(50));
if (allFilesExist) {
  console.log('🎉 SETUP VERIFICATION PASSED');
  console.log('\nYou can now run:');
  console.log('  pnpm fast           # CSV import automation');
  console.log('  pnpm validate-data  # UI validation (partial)');
} else {
  console.log('❌ SETUP VERIFICATION FAILED');
  console.log('\nPlease fix the issues above before running automation.');
}
console.log('=' .repeat(50));