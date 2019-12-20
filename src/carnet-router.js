import { v4 } from 'uuid';
import { CarnetAPIClient } from 'node-vw-carnet';
import { apiInstance } from './api-provider';
import LoginService from './login-service';
import { TokenNotFoundError, LoginError } from './errors';

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
   * Logins to carnet.
   *
   * @param {Req} req
   */
  async login(req) {
    const { email, password } = req.body;
    console.info(`>> login() - email: ${email}`);

    try {
      const { options } = await this.loginService.login(email, password);

      console.info('<< login() - successful login for carId =', options.carId);
      const token = v4();
      this.cachedSessions[token] = options;

      return { token };
    } catch (e) {
      console.warn(`Could not login, message: ${e.message}`, e);
      throw new LoginError('Could not login, try again (and check credentials)');
    }
  }

  /**
   * Starts the climate
   *
   * @param {Req} req
   */
  async startClimate(req) {
    const client = this.getClientByToken(req);

    return client.triggerClimatisation(true);
  }

  /**
   * Get the vehicle status
   *
   * @param {Req} req
   */
  async fetchVehicleStatus(req) {
    const client = this.getClientByToken(req);

    const details = await client.loadCarDetails();
    const emanager = await client.getEmanager();
    return {
      details,
      emanager
    };
  }

  async healthCheck() {
    return { status: 'ok' };
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
  }
}
