import { Hono } from 'hono';
import { TelemetrySchema } from '../schemas/telemetry';

export const telemetryRouter = new Hono();

telemetryRouter.post('/', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate telemetry data
    const telemetryData = TelemetrySchema.parse(body);
    
    // Here you would normally store the telemetry data
    // For now, just acknowledge receipt
    
    return c.json({ 
      ok: true, 
      timestamp: new Date().toISOString(),
      received: {
        vin: telemetryData.vin,
        timestamp: telemetryData.timestamp
      }
    });
    
  } catch (error) {
    return c.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Invalid telemetry data',
      timestamp: new Date().toISOString()
    }, 400);
  }
});

telemetryRouter.get('/status', async (c) => {
  try {
    const db = c.env?.TESLA_DB;
    if (!db) {
      return c.json({ error: 'Database not configured' }, 500);
    }

    const drives = await db.prepare(`SELECT COUNT(*) as cnt FROM drives`).first();
    const charges = await db.prepare(`SELECT COUNT(*) as cnt FROM charges`).first();
    const states = await db.prepare(`SELECT COUNT(DISTINCT start_state) as s FROM drives WHERE start_state IS NOT NULL`).first();
    const lastDrive = await db.prepare(`SELECT MAX(ended_at) as last_ended FROM drives`).first();
    const lastCharge = await db.prepare(`SELECT MAX(ended_at) as last_ended FROM charges`).first();
    
    return c.json({
      success: true,
      drives: (drives as any)?.cnt || 0,
      charges: (charges as any)?.cnt || 0,
      statesVisited: (states as any)?.s || 0,
      lastDriveAt: (lastDrive as any)?.last_ended || null,
      lastChargeAt: (lastCharge as any)?.last_ended || null,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    return c.json({ 
      success: false, 
      error: 'Status unavailable',
      timestamp: new Date().toISOString() 
    }, 500);
  }
});