import http from 'http';
import { apiInstance } from './src/api-provider';
import './src/main';

/**
 * A minimal web server that converts the request
 * object to something the lambda-api module understands.
 * https://gist.github.com/Sleavely/f87448d2c1c13d467f3ea8fc7e864955
 */

async function readBody(request) {
  const body = [];
  return new Promise((resolve, reject) => {
    request.on('data', chunk => {
      body.push(chunk);
    }).on('end', () => {
      resolve(body.join(''));
    }).on('error', reject);
  });
}

const serverWrapper = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}/`);

  const reqBody = await readBody(request);

  // The event object we're faking is a lightweight based on:
  // https://docs.aws.amazon.com/lambda/latest/dg/eventsources.html#eventsources-api-gateway-request
  const event = {
    httpMethod: request.method.toUpperCase(),
    path: url.pathname,
    resource: '/{proxy+}',
    queryStringParameters: [...url.searchParams.keys()].reduce((output, key) => {
      output[key] = url.searchParams.get(key);
      return output;
    }, {}),
    headers: request.headers,
    requestContext: {},
    pathParameters: {},
    stageVariables: {},
    isBase64Encoded: false,
    body: reqBody
  };

  console.log('REQ', event.body);

  apiInstance.run(event, {})
    .then((res) => {
      let { body } = res;

      const {
        headers,
        statusCode,
      } = res;

      if (res.isBase64Encoded) {
        body = Buffer.from(body, 'base64');
      }

      if (!headers['content-length'] && body) {
        headers['content-length'] = body.length;
      }

      response.writeHead(statusCode, headers);
      response.end(body);
    })
    .catch((err) => {
      console.error('Something went horribly, horribly wrong');
      response.writeHead(500, { 'content-length': 0 });
      response.end('');
      throw err;
    });
});

serverWrapper.listen(process.env.PORT || 3000, () => {
  console.log(`Listening on http://localhost:${serverWrapper.address().port}/`);
});
