import { apiInstance } from './util/api-provider';
import LoginService from './login-service';
import { LoginError, JsonError } from './errors';
import { carnetClientErrorWrapper } from './util/carnet-error-wrapper';
import checkToken from './middleware/check-token';

/** @typedef {import('lambda-api').Request} LambdaAPIRequest */
/** @typedef {import('lambda-api').Response} Response */
/** @typedef {LambdaAPIRequest & { carnetClient?: import('node-vw-carnet').CarnetAPIClient }} Request */

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
   * @param {Request} req
   * @param {Response} res
   */
  async login(req, res) {
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

      res.status(201).json(result);
      return result;
    } catch (e) {
      console.warn(`Could not login, message: ${e.message}`, e);
      throw new LoginError('Could not login, try again (and check credentials)');
    }
  }

  /**
   * Switch climate on/off.
   *
   * @param {Request} req
   */
  async triggerClimate(req) {
    const { carnetClient } = req;
    const { state } = req.params;

    const on = state === 'on';

    return carnetClientErrorWrapper(() => carnetClient.triggerClimatisation(on));
  }

  /**
   * Switch window heating on/off.
   *
   * @param {Request} req
   */
  async triggerWindowHeating(req) {
    const { carnetClient } = req;
    const { state } = req.params;

    const on = state === 'on';

    return carnetClientErrorWrapper(() => carnetClient.triggerWindowheating(on));
  }


  /**
   * Get the vehicle details.
   *
   * @param {Request} req
   */
  async getVehicleDetails(req) {
    const { carnetClient } = req;

    return carnetClientErrorWrapper(() => carnetClient.getVehicleDetails());
  }

  /**
   * Get Emanager info.
   *
   * @param {Request} req
   */
  async getEmanager(req) {
    const { carnetClient } = req;

    return carnetClientErrorWrapper(() => carnetClient.getEmanager());
  }

  /**
   * Get the fully loaded cars.
   *
   * @param {Request} req
   */
  async getFullyLoadedCars(req) {
    const { carnetClient } = req;

    return carnetClientErrorWrapper(() => carnetClient.loadCarDetails());
  }

  /**
   * Run any method on the Carnet API client.
   *
   * @param {Request} req
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
    api.post('/login', (req, res) => router.login(req, res));

    api.get('/vehicle/emanager',
      checkToken,
      (req) => router.getEmanager(req));

    api.get('/vehicle/details',
      checkToken,
      (req) => router.getVehicleDetails(req));

    api.get('/vehicle/info',
      checkToken,
      (req) => router.getFullyLoadedCars(req));

    api.post('/climate/:state',
      checkToken,
      (req) => router.triggerClimate(req));

    api.post('/window-heating/:state',
      checkToken,
      (req) => router.triggerWindowHeating(req));

    api.post('/action',
      checkToken,
      (req) => router.runMethod(req));
  }
}
