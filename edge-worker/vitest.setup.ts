import { config } from 'dotenv';
config({ path: './.dev.vars' });

console.log('Vitest Setup: Loaded environment variables:', process.env.OPENWEATHER_API_KEY, process.env.WEATHER_API_KEY);
