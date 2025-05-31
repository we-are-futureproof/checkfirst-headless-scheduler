const logger = require('./logger');

class ManualIntervention {
  constructor(page) {
    this.page = page;
  }

  async waitForManualAction(instruction, options = {}) {
    const {
      maxWaitTime = 300000, // 5 minutes default
      checkInterval = 2000,  // 2 seconds
      successCondition = null,
      timeoutMessage = 'Manual intervention timed out'
    } = options;

    const maxChecks = maxWaitTime / checkInterval;
    
    // Display instruction to user
    this.displayInstruction(instruction, maxWaitTime);
    
    // Take screenshot to show current state
    await this.takeInterventionScreenshot('manual-intervention-start');

    // Keep the browser stable - no control release
    logger.info('🔄 Automation paused - browser window should remain interactive');

    for (let i = 0; i < maxChecks; i++) {
      const elapsedTime = i * checkInterval;
      const remainingTime = maxWaitTime - elapsedTime;
      
      // Update progress every 10 seconds
      if (i % 5 === 0) {
        this.displayProgress(remainingTime);
      }

      // Check if success condition is met
      if (successCondition) {
        try {
          const success = await successCondition();
          if (success) {
            logger.info('✅ Manual intervention completed successfully');
            await this.takeInterventionScreenshot('manual-intervention-success');
            return true;
          }
        } catch (error) {
          // Continue waiting if check fails - don't log these as they're expected
        }
      }

      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }

    // Timeout reached
    logger.error(`❌ ${timeoutMessage}`);
    await this.takeInterventionScreenshot('manual-intervention-timeout');
    throw new Error(timeoutMessage);
  }

  async releaseBrowserControl() {
    try {
      // Disable request interception to allow normal browsing
      await this.page.setRequestInterception(false);
      
      // Remove any event listeners that might interfere
      await this.page.removeAllListeners();
      
      // Ensure the page is focused and ready for user interaction
      await this.page.bringToFront();
      await this.page.focus('body');
      
      logger.info('🔓 Browser control released for manual interaction');
    } catch (error) {
      logger.warn('⚠️ Could not fully release browser control:', error.message);
    }
  }

  async restoreBrowserControl() {
    try {
      // Re-enable request interception for performance
      await this.page.setRequestInterception(true);
      this.page.on('request', (req) => {
        if (req.resourceType() === 'stylesheet' || req.resourceType() === 'font') {
          req.abort();
        } else {
          req.continue();
        }
      });
      
      logger.info('🔒 Browser control restored to automation');
    } catch (error) {
      logger.warn('⚠️ Could not restore browser control:', error.message);
    }
  }

  displayInstruction(instruction, maxWaitTime) {
    const minutes = Math.floor(maxWaitTime / 60000);
    
    console.log('\n' + '='.repeat(80));
    console.log('🤚 MANUAL INTERVENTION REQUIRED');
    console.log('='.repeat(80));
    console.log(`📋 INSTRUCTION: ${instruction}`);
    console.log(`⏰ TIME LIMIT: ${minutes} minutes`);
    console.log(`🖥️  BROWSER: The browser window should be visible and interactive`);
    console.log(`🔄 STATUS: Automation is paused - window should stay open`);
    console.log(`📸 SCREENSHOT: Check screenshots/ folder for current state`);
    console.log('='.repeat(80));
    console.log('👆 FIND AND CLICK THE SIGN IN BUTTON IN THE BROWSER');
    console.log('⏳ Automation will detect completion and continue...\n');
    
    logger.info(`🤚 Manual intervention requested: ${instruction}`);
  }

  displayProgress(remainingTime) {
    const minutes = Math.floor(remainingTime / 60000);
    const seconds = Math.floor((remainingTime % 60000) / 1000);
    console.log(`⏳ Time remaining: ${minutes}:${seconds.toString().padStart(2, '0')}`);
  }

  async takeInterventionScreenshot(name) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `screenshots/${name}-${timestamp}.png`;
      await this.page.screenshot({ path: filename, fullPage: true });
      logger.info(`📸 Intervention screenshot: ${filename}`);
      return filename;
    } catch (error) {
      logger.error('Failed to take intervention screenshot:', error);
    }
  }

  async waitForAuthentication() {
    return this.waitForManualAction(
      'Please complete the sign-in process manually in the browser window',
      {
        maxWaitTime: 180000, // 3 minutes for auth
        checkInterval: 2000,
        successCondition: async () => {
          const url = await this.page.url();
          const isLoggedIn = this.isAuthenticatedUrl(url);
          
          if (isLoggedIn) {
            return true;
          }

          // Also check for dashboard elements that indicate successful login
          try {
            await this.page.waitForSelector('[href*="dashboard"], [href*="import"], text*="dashboard" i', { 
              timeout: 1000 
            });
            return true;
          } catch (e) {
            return false;
          }
        },
        timeoutMessage: 'Authentication timeout - please complete sign-in within 3 minutes'
      }
    );
  }

  async waitForNavigation(instruction, expectedUrlPattern) {
    return this.waitForManualAction(
      instruction,
      {
        maxWaitTime: 120000, // 2 minutes
        successCondition: async () => {
          const url = await this.page.url();
          return expectedUrlPattern ? url.includes(expectedUrlPattern) : true;
        },
        timeoutMessage: `Navigation timeout - expected URL pattern: ${expectedUrlPattern}`
      }
    );
  }

  async waitForElement(instruction, selector) {
    return this.waitForManualAction(
      instruction,
      {
        maxWaitTime: 180000, // 3 minutes
        successCondition: async () => {
          try {
            await this.page.waitForSelector(selector, { timeout: 1000 });
            return true;
          } catch (e) {
            return false;
          }
        },
        timeoutMessage: `Element not found: ${selector}`
      }
    );
  }

  isAuthenticatedUrl(url) {
    const authenticatedPatterns = [
      '/dashboard',
      '/home',
      '/main',
      '/app',
      '/portal',
      '/import',
      'schedule.checkfirst.ai/dashboard'
    ];
    
    return authenticatedPatterns.some(pattern => url.includes(pattern));
  }

  async promptUser(message, options = {}) {
    console.log('\n' + '='.repeat(60));
    console.log(`🤔 USER INPUT NEEDED`);
    console.log('='.repeat(60));
    console.log(`❓ ${message}`);
    
    if (options.choices) {
      console.log(`📝 Options: ${options.choices.join(', ')}`);
    }
    
    console.log('='.repeat(60));
    
    // For now, just wait and assume user will take action
    // In a more advanced version, you could use readline for actual input
    return this.waitForManualAction(
      `${message} (Continue when ready)`,
      { maxWaitTime: 300000 }
    );
  }
}

module.exports = ManualIntervention;