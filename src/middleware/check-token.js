import LoginService from '../login-service';
import { JsonError } from '../errors';

/** @typedef {import('lambda-api').Request} Request */
/** @typedef {import('lambda-api').Response} Response */
/** @typedef {import('lambda-api').NextFunction} NextFunction */


/**
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
export default function checkToken(req, res, next, loginService = LoginService.Instance) {
  const { token } = req.headers;
  if (!token) {
    throw new JsonError('Missing token header', 400, 'missing.token.header');
  }

  req.carnetClient = loginService.getCarnetClientByToken(token);

  next();
}
