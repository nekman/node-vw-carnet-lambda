import { CarnetAPIClient } from 'node-vw-carnet';
import { v4 } from 'uuid';
import { defaultLoginHandlerProvider, defaultBrowserProvider } from './util/providers';
import { carnetClientErrorWrapper } from './util/carnet-error-wrapper';
import { Cache } from './util/memory-cache';
import { TokenNotFoundError, LoginError } from './errors';

/** @typedef {import('node-vw-carnet').CarnetLoginHandler} LoginHandler */
/** @typedef {import('puppeteer').Page} PuppeterPage */

export default class LoginService {

  /**
   * @param {(page: PuppeterPage) => LoginHandler} loginHandlerProvider
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


  /**
   * Login with Carnet username/password.
   *
   * @param {string} email
   * @param {string} password
   */
  async createTokenWithCredentials(email, password) {
    console.info(`>> createTokenWithCredentials() - email: ${email}`);

    const { options } = await this.login(email, password);

    return this.createToken(options);
  }

  /**
   * Login with options.
   * @param {{ carId: string, csrfToken: string, cookies: [] }} options
   */
  async createTokenWithOptions(options) {
    console.info('>> createTokenWithOptions() - options:', options);

    const client = new CarnetAPIClient(options);

    // Verify that the options is valid by sending a request.
    // TODO: Check is this is the best way to verify that a Carnet session is valid.
    await carnetClientErrorWrapper(() => client.getLocation());

    console.info('<< createTokenWithOptions()');
    return this.createToken(options);
  }


  /**
   * @private
   * @param {string} token
   */
  getCarnetClientByToken(token) {
    console.log('>> getCarnetClientByToken()');

    const options = Cache.get(token);
    if (!options) {
      console.warn(`Token: ${token} not found!`);
      throw new TokenNotFoundError('Token not found');
    }

    console.log('<< getCarnetClientByToken()');
    return new CarnetAPIClient(options);
  }

  /**
   * @private
   * @param {any} options
   */
  createToken(options) {
    const token = v4();
    Cache.set(token, options);

    return { token, options };
  }

}

LoginService.Instance = new LoginService();
