import { CorsOptions } from 'cors';

/**
 * Defines a strict CORS configuration for web application security
 */
export const configureCorsPolicy = (): CorsOptions => {
  const allowedOrigins: string[] = [
    'https://example.com',
    'https://www.example.com',
    // TODO: Add production and staging domain origins
  ];

  return {
    origin: (origin, callback) => {
      // If no origin is provided (like server-to-server requests), allow
      if (!origin) {
        return callback(null, true);
      }

      // Check if origin is in allowed list
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS policy'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 3600 // 1 hour cache preflight request
  };
};
