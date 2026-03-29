import cors from 'cors';
import corsOptions from '../config/corsOptions';

const corsMiddleware = cors(corsOptions);

export default corsMiddleware;