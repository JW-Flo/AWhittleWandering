export const corsConfig = {
  allowedOrigins: [
    'http://localhost:3000',
    'https://yourdomain.com',
    'https://www.yourdomain.com'
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin'
  ],
  maxAge: 86400 // 24 hours
};
