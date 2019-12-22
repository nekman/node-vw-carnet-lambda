import { apiInstance } from './api-provider';
import LoginService from './login-service';
import { LoginError, JsonError } from './errors';
import { carnetClientErrorWrapper } from './carnet-error-wrapper';
import checkToken from './middleware/check-token';

/** @typedef {import('lambda-api').Request} Req */
/** @typedef {import('lambda-api').Response} Res */

export default class CarnetRouter {
  /**
   *
   * @param {LoginService?} loginService
   * @param {{ [token: string]: any }?} sessions
   */
  constructor(loginService = new LoginService()) {
    this.loginService = loginService;
  }

  /**
   * Login to Carnet.
   *
   * @param {Req} req
   */
  async login(req) {
    const { email, password } = req.body;
    console.info('>> login()');

    let result;
    try {
      if (req.body.options) {
        // Login with options (carId, csrfToken and cookies)
        result = await this.loginService.createTokenWithOptions(req.body.options);
      } else {
        // Login with credentials (username / password)
        result = await this.loginService.createTokenWithCredentials(email, password);
      }

      console.info('<< login() - successful login for carId = %s, token = %s', result.options.carId, result.token);
      return result;
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
    const { carnetClient } = req;

    return carnetClientErrorWrapper(() => carnetClient.triggerClimatisation(true));
  }

  /**
   * Get the vehicle status.
   *
   * @param {Req} req
   */
  async fetchVehicleStatus(req) {
    const { carnetClient } = req;

    return carnetClientErrorWrapper(() => carnetClient.getVehicleDetails());
  }

  /**
   * Run any method on the Carnet API client.
   *
   * @param {Req} req
   */
  async runMethod(req) {
    const { carnetClient } = req;
    const { method } = req.query;
    if (!method) {
      throw new JsonError('Expected a method query parameter', 400, 'no.such.method');
    }

    const clientMethod = carnetClient[method];
    if (typeof clientMethod !== 'function') {
      throw new JsonError(`No such method ${method}`, 400, 'no.such.method');
    }

    return carnetClientErrorWrapper(() => clientMethod.apply(carnetClient, []));
  }

  async healthCheck() {
    return { status: 'ok' };
  }

  static create(api = apiInstance) {
    const router = new CarnetRouter();

    api.get('/', () => router.healthCheck());
    api.post('/login', (req) => router.login(req));

    api.get('/vehicle',
      checkToken,
      (req) => router.fetchVehicleStatus(req));

    api.post('/startclimate',
      checkToken,
      (req) => router.startClimate(req));

    api.post('/action',
      checkToken,
      (req) => router.runMethod(req));
  }
}
