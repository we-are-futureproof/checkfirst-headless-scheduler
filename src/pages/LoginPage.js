const logger = require('../utils/logger');

class LoginPage {
  constructor(page) {
    this.page = page;
  }

  async navigate(baseUrl) {
    logger.info(`Navigating to login page: ${baseUrl}`);
    await this.page.goto(baseUrl, { waitUntil: 'networkidle2' });

    // Wait for login form to be visible
    await this.page.waitForSelector('input[type="email"], input[name="email"]', { visible: true });
    logger.info('Login page loaded successfully');
  }

  async login(username, password) {
    logger.info(`Attempting login for user: ${username}`);

    // Fill email field
    const emailSelector = 'input[type="email"], input[name="email"]';
    await this.page.waitForSelector(emailSelector);
    await this.page.type(emailSelector, username);

    // Fill password field
    const passwordSelector = 'input[type="password"], input[name="password"]';
    await this.page.waitForSelector(passwordSelector);
    await this.page.type(passwordSelector, password);

    // Click sign in button
    const signInSelector = 'button:has-text("Sign in"), button[type="submit"]';
    await this.page.click(signInSelector);

    // Wait for navigation after login
    await this.page.waitForNavigation({ waitUntil: 'networkidle2' });

    logger.info('Login completed successfully');
  }
}

module.exports = LoginPage;