import chromium from 'chrome-aws-lambda';
import { CarnetLoginHandler } from 'node-vw-carnet';
import { LoginError } from '../errors';

/** @typedef {import('puppeteer').Browser} PuppeterBrowser */
/** @typedef {import('puppeteer').Page} PuppeterPage */

/**
 * @return {Promise<PuppeterBrowser>}
 */
export async function defaultBrowserProvider() {
  try {
    const options = {
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      // Avoid ERR_CERT_AUTHORITY_INVALID errors
      ignoreHTTPSErrors: true,
      headless: true
    };

    return await chromium.puppeteer.launch(options);
  } catch (e) {
    console.error('ERROR: could not create browser', e);
    throw new LoginError('Could not create chromium browser!');
  }
}

/**
 *
 * @param {PuppeterPage} page
 * @return {CarnetLoginHandler}
 */
export function defaultLoginHandlerProvider(page) {
  return new CarnetLoginHandler(page);
}
