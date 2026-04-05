import { requestLogger } from './middlewares/requestLogger.ts';
import { privacyMiddleware } from './middlewares/privacyMiddleware.ts';
import { rateLimitMiddleware } from './middlewares/rateLimitMiddleware.ts';
import { corsMiddleware } from './middlewares/corsMiddleware.ts';
import { handleRoutes } from './routes.ts';

export default {
  async fetch(request, env, ctx) {
    const middlewares = [requestLogger, privacyMiddleware, rateLimitMiddleware, corsMiddleware];
    let index = 0;
    async function next() {
      if (index < middlewares.length) {
        const middleware = middlewares[index++];
        return await middleware(request, next, env, ctx);
      }
      return await handleRoutes(request, env, ctx);
    }
    return await next();
  }
}