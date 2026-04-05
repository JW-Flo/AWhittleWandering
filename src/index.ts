import { requestLogger } from './middleware/requestLogger';
import { privacy } from './middleware/privacy';
import { rateLimit } from './middleware/rateLimit';
import { cors } from './middleware/cors';

// Example route handler - replace with actual routes
const handleRequest = async (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> => {
  return new Response('Hello, World!', {
    headers: { 'Content-Type': 'text/plain' },
  });
};

// Compose middleware in the required order:
// logging -> privacy -> rate limiting -> CORS
const composedHandler = cors(
  rateLimit(
    privacy(
      requestLogger(handleRequest)
    )
  )
);

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return composedHandler(request, env, ctx);
  },
};
