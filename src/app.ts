import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { globalRateLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors());

// Rate Limiting
app.use(globalRateLimiter);

// JSON Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;