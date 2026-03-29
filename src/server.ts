import express from 'express';
import corsMiddleware from './middleware/corsMiddleware';

const app = express();

// Apply CORS middleware before routes
app.use(corsMiddleware);

// Rest of server configuration
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('Server running on port ${PORT}');
});

export default app;