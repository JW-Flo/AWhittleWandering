import { Hono } from 'hono';
import { rateLimit } from './middleware/rateLimit';

// Create Hono app
const app = new Hono();

// Global rate limiter: 100 requests per minute
app.use('*', rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
}));

// Example route
app.get('/', (c) => {
  return c.text('Hello World!');
});

// Example route with stricter limit
app.get('/api/strict', rateLimit({
  windowMs: 60 * 1000,
  maxRequests: 5,
}), (c) => {
  return c.json({ message: 'Strict endpoint' });
});

export default app;
