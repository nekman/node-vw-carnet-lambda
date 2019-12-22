import { JsonError, CarnetLoginError } from './errors';

/**
 * @param {() => Promise<any>} fn
 */
export async function carnetClientErrorWrapper(fn) {
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
