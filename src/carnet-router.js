import { v4 } from 'uuid';
import { CarnetAPIClient } from 'node-vw-carnet';
import { apiInstance } from './api-provider';
import LoginService from './login-service';
import {
  TokenNotFoundError, LoginError, JsonError, CarnetLoginError
} from './errors';

const cachedSessions = {};

/** @typedef {import('lambda-api').Request} Req */
/** @typedef {import('lambda-api').Response} Res */

export default class CarnetRouter {
  /**
   *
   * @param {LoginService?} loginService
   * @param {{ [token: string]: any }?} sessions
   */
  constructor(loginService = new LoginService(), sessions = cachedSessions) {
    this.loginService = loginService;
    this.cachedSessions = sessions;
  }

  /**
   * Login to Carnet.
   *
   * @param {Req} req
   */
  async login(req) {
    const { email, password } = req.body;
    console.info('>> login()');

    try {

      let options;
      if (req.body.options) {
        // Login with options (carId, csrfToken and cookies)
        options = await this.createTokenWithOptions(req.body.options);
      } else {
        // Login with credentials (username / password)
        options = await this.createTokenWithCredentials(email, password);
      }

      const token = v4();
      this.cachedSessions[token] = options;

      console.info('<< login() - successful login for carId = %s, token = %s', options.carId, token);

      return { token, options };
    } catch (e) {
      console.warn(`Could not login, message: ${e.message}`, e);
      throw new LoginError('Could not login, try again (and check credentials)');
    }
  }

  /**
   * Starts the climate.
   *
   * @param {Req} req
   */
  async startClimate(req) {
    const client = this.getClientByToken(req);

    return this.carnetClientErrorWrapper(() => client.triggerClimatisation(true));
  }

  /**
   * Get the vehicle status.
   *
   * @param {Req} req
   */
  async fetchVehicleStatus(req) {
    const client = this.getClientByToken(req);

    return this.carnetClientErrorWrapper(() => client.getVehicleDetails());
  }

  /**
   * Run any method on the Carnet API client.
   *
   * @param {Req} req
   */
  async runMethod(req) {
    const client = this.getClientByToken(req);
    const { method } = req.query;
    if (!method) {
      throw new JsonError('Expected a method query parameter', 400, 'no.such.method');
    }

    const clientMethod = client[method];
    if (typeof clientMethod !== 'function') {
      throw new JsonError(`No such method ${method}`, 400, 'no.such.method');
    }

    return this.carnetClientErrorWrapper(() => clientMethod.apply(client, []));
  }

  async healthCheck() {
    return { status: 'ok' };
  }

  /**
   * @private
   *
   * Login with Carnet credentials.
   * @param {string} email
   * @param {string} password
   */
  async createTokenWithCredentials(email, password) {
    console.info(`>> login() - email: ${email}`);

    const { options } = await this.loginService.login(email, password);

    return options;
  }

  /**
   * @private
   *
   * Login with options.
   * @param {{ carId: string, csrfToken: string, cookies: [] }} options
   */
  async createTokenWithOptions(options) {
    console.info('>> login() - options:', options);

    const client = new CarnetAPIClient(options);

    // Verify that the options is valid by sending a request
    await this.carnetClientErrorWrapper(() => client.getLocation());

    return options;
  }

  /**
   * @private
   * @param {() => Promise<any>} fn
   */
  async carnetClientErrorWrapper(fn) {
    let res;

    try {
      res = await fn();
    } catch (e) {
      console.error('Carnet API client error', e);
      throw new JsonError(e.message, 400, e.type || 'carnet.client.error');
    }

    if (res && res.errorCode !== '0') {
      throw new CarnetLoginError('Invalid credentials, try to login with email/password');
    }

    return res;
  }

  /**
   * @private
   * @param {Req} req
   */
  getClientByToken(req) {
    const { token } = req.headers;
    const options = this.cachedSessions[token];
    if (!options) {
      console.warn(`Token: ${token} not found!`);
      throw new TokenNotFoundError('Token not found');
    }

    return new CarnetAPIClient(options);
  }

  static create(api = apiInstance) {
    const router = new CarnetRouter();

    api.get('/', () => router.healthCheck());
    api.get('/vehicle', (req) => router.fetchVehicleStatus(req));
    api.post('/login', (req) => router.login(req));
    api.post('/startclimate', (req) => router.startClimate(req));
    api.post('/action', (req) => router.runMethod(req));
  }
}
