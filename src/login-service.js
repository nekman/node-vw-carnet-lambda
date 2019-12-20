import chromium from 'chrome-aws-lambda';
import { CarnetLoginHandler } from 'node-vw-carnet';
import { LoginError } from './errors';

/** @typedef {import('puppeteer').Browser} PuppeterBrowser */
/** @typedef {import('puppeteer').Page} PuppeterPage */

/**
 * @return {PuppeterBrowser}
 */
async function defaultBrowserProvider() {
  try {
    return await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      // Avoid ERR_CERT_AUTHORITY_INVALID errors
      ignoreHTTPSErrors: true,
      headless: true
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Could not create browser', e);
    throw new LoginError('Could not create browser!');
  }
}

/**
 *
 * @param {PuppeterPage} page
 * @return {CarnetLoginHandler}
 */
function defaultLoginHandlerProvider(page) {
  return new CarnetLoginHandler(page);
}

export default class LoginService {

  /**
   * @param {(page: PuppeterPage) => CarnetLoginHandler} loginHandlerProvider
   * @param {() => Promise<import('puppeteer').Browser>?} browserProvider
   */
  constructor(loginHandlerProvider = defaultLoginHandlerProvider, browserProvider = defaultBrowserProvider) {
    this.loginHandlerProvider = loginHandlerProvider;
    this.browserProvider = browserProvider;
  }

  /**
   *
   * @param {string} email
   * @param {string} password
   * @return {Promise<import('node-vw-carnet').CarnetAPIClient>}
   */
  async login(email, password) {
    let browser;
    try {
      browser = await this.browserProvider();
      const page = await browser.newPage();

      return await this.loginHandlerProvider(page).createClient({ email, password });
    } catch (e) {
      console.error('Error when logging in to Car Net', e);
      throw new LoginError('Could not login to Car Net');
    } finally {
      if (browser) {
        browser.close();
      }
    }
  }
}

