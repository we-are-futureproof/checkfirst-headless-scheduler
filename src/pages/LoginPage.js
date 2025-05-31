const BasePageObject = require('../utils/BasePageObject');
const SELECTORS = require('../constants/selectors');
const MESSAGES = require('../constants/messages');
const { LoginError } = require('../errors/AutomationError');
const logger = require('../utils/logger');

class LoginPage extends BasePageObject {
  constructor(page) {
    super(page);
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

    try {
      // Fill email field with retry
      await this.typeWithRetry(SELECTORS.LOGIN.EMAIL_INPUT, username, {
        operationName: 'enter email'
      });

      // Fill password field with retry
      await this.typeWithRetry(SELECTORS.LOGIN.PASSWORD_INPUT, password, {
        operationName: 'enter password'
      });

      // Click sign in button with retry
      await this.clickWithRetry(SELECTORS.LOGIN.SIGN_IN_BUTTON, {
        operationName: 'click sign in'
      });

      // Wait for navigation after login
      await this.retryOperation(async () => {
        await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
      }, 3, 2000, 'wait for login navigation');

      logger.info(MESSAGES.LOGIN.SUCCESS);
    } catch (error) {
      const screenshot = await this.takeScreenshot('login-error', { username });
      throw new LoginError(
        `Login failed: ${error.message}`,
        { username, screenshot, originalError: error.message }
      );
    }
  }
}

module.exports = LoginPage;