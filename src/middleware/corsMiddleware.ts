import { Request, Response, NextFunction } from 'express';

interface CorsOptions {
  /**
   * Either a boolean (`true` to reflect the request origin, `false` to disable),
   * an array of allowed origins (strings), or a function that returns true/false.
   * Defaults to `false`.
   */
  allowedOrigins?: boolean | string[] | ((origin: string | undefined) => boolean);
  /**
   * A string or array of strings representing the allowed HTTP methods.
   * Defaults to ['GET','HEAD','PUT','PATCH','POST','DELETE'].
   */
  allowedMethods?: string | string[];
  /**
   * A string or array of strings representing the allowed headers.
   * Defaults to ['Content-Type','Authorization'].
   */
  allowedHeaders?: string | string[];
  /**
   * A string or array of strings representing the exposed headers.
   * Defaults to [].
   */
  exposedHeaders?: string | string[];
  /**
   * Boolean indicating whether credentials are allowed.
   * Defaults to false.
   */
  credentials?: boolean;
  /**
   * Number representing the max age (in seconds) for preflight requests.
   * Defaults to 5*60.
   */
  maxAge?: number;
}

const DEFAULT_METHODS = ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'];
const DEFAULT_HEADERS = ['Content-Type', 'Authorization'];
const DEFAULT_MAX_AGE = 5 * 60; // 5 minutes

/**
 * Returns Express middleware that handles CORS.
 * @param options - Configuration options.
 */
export function corsMiddleware(options: CorsOptions = {}) {
  const {
    allowedOrigins = false,
    allowedMethods = DEFAULT_METHODS,
    allowedHeaders = DEFAULT_HEADERS,
    exposedHeaders = [],
    credentials = false,
    maxAge = DEFAULT_MAX_AGE,
  } = options;

  const methodsArray = Array.isArray(allowedMethods) ? allowedMethods : [allowedMethods];
  const headersArray = Array.isArray(allowedHeaders) ? allowedHeaders : [allowedHeaders];
  const exposedArray = Array.isArray(exposedHeaders) ? exposedHeaders : [exposedHeaders];

  return function corsMiddleware(req: Request, res: Response, next: NextFunction) {
    const origin = req.headers.origin;

    // Determine if origin is allowed
    let allowOrigin: string | false = false;
    if (typeof allowedOrigins === 'function') {
      allowOrigin = allowedOrigins(origin) ? origin ?? '' : false;
    } else if (Array.isArray(allowedOrigins)) {
      allowOrigin = allowedOrigins.includes(origin ?? '') ? origin ?? '' : false;
    } else if (allowedOrigins === true) {
      // Reflect request origin if credentials, else '*'.
      allowOrigin = credentials && origin ? origin : '*'; // '*' is safe when credentials false
    }

    // If origin not allowed, skip CORS headers (but still handle preflight)
    const isAllowed = allowOrigin !== false;

    // Handle preflight request
    if (req.method === 'OPTIONS' && isAllowed) {
      res.setHeader('Access-Control-Allow-Origin', allowOrigin as string);
      if (credentials) {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }
      res.setHeader('Access-Control-Allow-Methods', methodsArray.join(', '));
      res.setHeader('Access-Control-Allow-Headers', headersArray.join(', '));
      if (exposedArray.length) {
        res.setHeader('Access-Control-Expose-Headers', exposedArray.join(', '));
      }
      res.setHeader('Access-Control-Max-Age', String(maxAge));
      return res.sendStatus(204);
    }

    // Actual CORS headers for simple requests
    if (isAllowed) {
      res.setHeader('Access-Control-Allow-Origin', allowOrigin as string);
      if (credentials) {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }
      if (exposedArray.length) {
        res.setHeader('Access-Control-Expose-Headers', exposedArray.join(', '));
      }
    }

    next();
  };
}
