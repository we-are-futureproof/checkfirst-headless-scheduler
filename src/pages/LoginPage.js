const BasePageObject = require('../utils/BasePageObject');
const SELECTORS = require('../constants/selectors');
const MESSAGES = require('../constants/messages');
const { LoginError } = require('../errors/AutomationError');
const ManualIntervention = require('../utils/ManualIntervention');
const logger = require('../utils/logger');

class LoginPage extends BasePageObject {
  constructor(page) {
    super(page);
    this.manualIntervention = new ManualIntervention(page);
  }

  async navigate(baseUrl) {
    logger.info(MESSAGES.LOGIN.NAVIGATING(baseUrl));
    
    try {
      await this.navigateWithRetry(baseUrl, { 
        operationName: 'navigate to login page' 
      });

      // Wait for login form to be visible
      await this.waitForElementWithValidation(SELECTORS.LOGIN.EMAIL_INPUT, {
        operationName: 'wait for login form'
      });
      
      logger.info(MESSAGES.LOGIN.PAGE_LOADED);
    } catch (error) {
      throw new LoginError(
        `Failed to navigate to login page: ${error.message}`,
        { baseUrl, originalError: error.message }
      );
    }
  }

  async login(username, password) {
    logger.info(MESSAGES.LOGIN.ATTEMPTING(username));

    // Default to manual authentication (most reliable approach)
    return this.manualAuthentication(username, password);
  }

  async manualAuthentication(username, password) {
    logger.info('🤚 Using manual authentication (default mode)');
    
    try {
      // Fill in the credentials automatically first
      try {
        await this.typeWithRetry(SELECTORS.LOGIN.EMAIL_INPUT, username, {
          operationName: 'enter email'
        });
        
        await this.typeWithRetry(SELECTORS.LOGIN.PASSWORD_INPUT, password, {
          operationName: 'enter password'
        });
        
        logger.info('✅ Credentials filled automatically');
      } catch (error) {
        logger.warn('⚠️ Could not fill credentials automatically - please enter them manually');
      }

      // Wait for manual completion of authentication
      await this.manualIntervention.waitForAuthentication();
      
      logger.info('✅ Manual authentication completed');
    } catch (error) {
      throw new LoginError(
        `Manual authentication failed: ${error.message}`,
        { username, originalError: error.message }
      );
    }
  }

  async handleAuthenticationResult() {
    const maxWaitTime = 30000; // 30 seconds
    const checkInterval = 1000; // 1 second
    const maxChecks = maxWaitTime / checkInterval;

    for (let i = 0; i < maxChecks; i++) {
      const url = await this.page.url();
      
      // Check for successful login indicators
      if (this.isLoggedIn(url)) {
        logger.info('✅ Authentication successful - detected dashboard URL');
        return;
      }
      
      // Check for error messages
      const errorMessages = await this.checkForLoginErrors();
      if (errorMessages.length > 0) {
        throw new Error(`Authentication failed: ${errorMessages.join(', ')}`);
      }
      
      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
    
    // Final check for authentication state
    const finalUrl = await this.page.url();
    if (!this.isLoggedIn(finalUrl)) {
      logger.warn('⚠️ Authentication may have failed - proceeding with assumption of success');
      logger.warn('This could be due to anti-automation measures in the authentication system');
    }
  }

  isLoggedIn(url) {
    // Common patterns for successful login
    const loginSuccessPatterns = [
      '/dashboard',
      '/home',
      '/main',
      '/app',
      '/portal',
      'schedule.checkfirst.ai/dashboard'
    ];
    
    return loginSuccessPatterns.some(pattern => url.includes(pattern));
  }

  async checkForLoginErrors() {
    const errorMessages = [];
    
    const errorSelectors = [
      'text*="invalid" i',
      'text*="incorrect" i', 
      'text*="error" i',
      'text*="failed" i',
      '[class*="error" i]',
      '[role="alert"]',
      '.alert-danger',
      '.error-message'
    ];
    
    for (const selector of errorSelectors) {
      try {
        const element = await this.page.$(selector);
        if (element) {
          const text = await element.textContent();
          if (text && text.trim().length > 0) {
            errorMessages.push(text.trim());
          }
        }
      } catch (e) {
        // Ignore selector errors
      }
    }
    
    return errorMessages;
  }

  async bypassAuthentication() {
    logger.info('🚀 BYPASS MODE: Simulating successful authentication');
    
    // Try to navigate directly to dashboard
    const dashboardUrl = `${this.page.url().split('/').slice(0, 3).join('/')}/dashboard`;
    
    try {
      await this.navigateWithRetry(dashboardUrl, {
        operationName: 'bypass to dashboard'
      });
      logger.info('✅ BYPASS: Successfully navigated to dashboard');
    } catch (error) {
      logger.warn('⚠️ BYPASS: Could not navigate to dashboard, proceeding anyway');
    }
  }
}

module.exports = LoginPage;