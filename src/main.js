import CarnetRouter from './carnet-router';
import { apiInstance } from './util/api-provider';
import { JsonError } from './errors';

// Create routes
CarnetRouter.create(apiInstance);

// Global error handler
apiInstance.use((err, req, res, next) => {
  console.error('ERROR:', err);
  if (err instanceof JsonError) {
    res.status(err.status).json(err.toJsonError());
    return next();
  }

  res.error(500, err.message);
  // continue
  next();
});

// Display registered routes
apiInstance.routes(true);

/**
 *
 * @param {import('aws-lambda').APIGatewayProxyEvent} event
 * @param {import('aws-lambda').APIGatewayEventRequestContext} context
 */
export async function handler(event, context)  {
  // eslint-disable-next-line no-return-await
  return await apiInstance.run(event, context);
}

