import { Hono } from 'hono';

export const analyticsRouter = new Hono();

analyticsRouter.get('/daily', async (c) => {
  try {
    const db = c.env?.TESLA_DB;
    if (!db) return c.json({ error: 'Database not available' }, 500);

    const limit = Math.min(Number(c.req.query('limit') || 30), 365);
    const offset = Number(c.req.query('offset') || 0);

    const data = await db.prepare(`
      SELECT * FROM daily_analytics 
      ORDER BY date DESC 
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();

    return c.json({ results: data.results || [] });
  } catch (error) {
    return c.json({ error: (error as any)?.message }, 500);
  }
});

analyticsRouter.get('/states', async (c) => {
    try {
      const db = c.env?.TESLA_DB;
      if (!db) return c.json({ error: 'Database not available' }, 500);
  
      const states = await db.prepare(`
        SELECT * FROM states_visited 
        ORDER BY first_visited_date ASC
      `).all();
  
      return c.json({ states: states.results || [] });
    } catch (error) {
      return c.json({ error: (error as any)?.message }, 500);
    }
  });

analyticsRouter.get('/efficiency', async (c) => {
  try {
    const db = c.env?.TESLA_DB;
    if (!db) return c.json({ error: 'Database not available' }, 500);

    const limit = Math.min(Number(c.req.query('limit') || 30), 100);
    
    const metrics = await db.prepare(`
      SELECT date, efficiency_miles_per_kwh, avg_speed_mph, avg_outside_temp_f 
      FROM efficiency_metrics 
      ORDER BY date DESC 
      LIMIT ?
    `).bind(limit).all();

    return c.json({ metrics: metrics.results || [] });
  } catch (error) {
    return c.json({ error: (error as any)?.message }, 500);
  }
});
