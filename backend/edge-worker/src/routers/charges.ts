import { Hono } from 'hono';

export const chargesRouter = new Hono();

chargesRouter.get('/', async (c) => {
  try {
    const db = c.env?.TESLA_DB;
    if (!db) {
      return c.json({ error: 'Database not available' }, 500);
    }

    const limit = Math.min(Number(c.req.query('limit') || 20), 100);
    const offset = Number(c.req.query('offset') || 0);
    const vehicleId = c.req.query('vehicleId');

    let query = `SELECT * FROM charges`;
    const params: any[] = [];

    if (vehicleId) {
      query += ` WHERE vehicle_id = ?`;
      params.push(vehicleId);
    }

    query += ` ORDER BY started_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const charges = await db.prepare(query).bind(...params).all();
    const count = await db.prepare(`SELECT COUNT(*) as total FROM charges ${vehicleId ? 'WHERE vehicle_id = ?' : ''}`).bind(...(vehicleId ? [vehicleId] : [])).first();

    return c.json({
      charges: charges.results || [],
      pagination: {
        total: (count as any)?.total || 0,
        limit,
        offset
      }
    });
  } catch (error) {
    return c.json({ error: (error as any)?.message }, 500);
  }
});

chargesRouter.get('/:id', async (c) => {
  try {
    const db = c.env?.TESLA_DB;
    if (!db) {
      return c.json({ error: 'Database not available' }, 500);
    }

    const id = c.req.param('id');
    const charge = await db.prepare(`SELECT * FROM charges WHERE id = ? OR tessie_id = ?`).bind(id, id).first();

    if (!charge) {
      return c.json({ error: 'Charge not found' }, 404);
    }

    return c.json(charge);
  } catch (error) {
    return c.json({ error: (error as any)?.message }, 500);
  }
});
