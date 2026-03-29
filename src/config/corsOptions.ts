import { CorsOptions } from 'cors';

const allowedOrigins = [
  'https://yourmainwebsite.com',
  'http://localhost:3000',
  'https://staging.yourdomain.com'
];

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept'
  ],
  credentials: true,
  maxAge: 3600
};

export default corsOptions;