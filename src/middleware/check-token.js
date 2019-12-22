import LoginService from '../login-service';

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

  req.carnetClient = loginService.getCarnetClientByToken(token);

  next();
}
