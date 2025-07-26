import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

app.use('*', cors());

// Tesla telemetry endpoint
app.post('/api/v1/telemetry', async (c) => {
  try {
    const data = await c.req.json();
    
    // Validate Tesla data structure
    const telemetry = {
      timestamp: data.timestamp || Date.now(),
      location: {
        lat: data.lat,
        lng: data.lng
      },
      battery: {
        level: data.battery_level,
        charging: data.charging_state === 'Charging'
      },
      vehicle: {
        speed: data.speed,
        heading: data.heading,
        odometer: data.odometer
      }
    };

    // Store in KV or return for now
    return c.json({ success: true, data: telemetry });
  } catch (error) {
    return c.json({ error: 'Invalid telemetry data' }, 400);
  }
});

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: Date.now() });
});

// Trip data endpoint
app.get('/api/v1/trip', (c) => {
  return c.json({ 
    trip: '48 Continental States',
    status: 'in-progress',
    vehicle: 'Tesla Model Y'
  });
});

export default app;
