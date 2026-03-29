import express from 'express';
import { corsMiddleware } from './middleware/cors';
import { corsConfig } from './config/cors.config';

const app = express();

// Apply CORS middleware
app.use(corsMiddleware(corsConfig));

// Other middleware and route configurations
app.use(express.json());

// Example route
app.get('/', (req, res) => {
  res.json({ message: 'CORS-enabled API' });
});

export default app;
