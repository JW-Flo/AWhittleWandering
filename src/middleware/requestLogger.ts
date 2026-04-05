import type { Env, ExecutionContext } from '@cloudflare/workers-types';

/**
 * Middleware to log incoming requests with method, path, and response status.
 * @param request - The incoming request
 * @param env - Environment bindings
 * @param ctx - Execution context
 * @param next - The next handler in the chain
 * @returns Promise resolving to the response from the next handler
 */
export async function requestLogger(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  next: (request: Request, env: Env, ctx: ExecutionContext) => Promise<Response>
): Promise<Response> {
  const url = new URL(request.url);
  const logEntry = {
    method: request.method,
    path: url.pathname + url.search,
    timestamp: new Date().toISOString(),
  };
  console.log('[RequestLogger] Incoming request:', logEntry);

  let response: Response;
  try {
    response = await next(request, env, ctx);
  } catch (err) {
    console.error('[RequestLogger] Error during request handling:', err);
    throw err;
  }

  const logOut = {
    ...logEntry,
    status: response.status,
    statusText: response.statusText,
  };
  console.log('[RequestLogger] Completed request:', logOut);

  return response;
}
