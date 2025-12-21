import { Hono } from 'hono';

export const drivesRouter = new Hono();

drivesRouter.get('/', async (c) => {
  try {
    const db = c.env?.TESLA_DB;
    if (!db) {
      return c.json({ error: 'Database not available' }, 500);
    }

    const limit = Math.min(Number(c.req.query('limit') || 20), 100);
    const offset = Number(c.req.query('offset') || 0);
    const vehicleId = c.req.query('vehicleId');

    let query = `SELECT * FROM drives`;
    const params: any[] = [];

    if (vehicleId) {
      query += ` WHERE vehicle_id = ?`;
      params.push(vehicleId);
    }

    query += ` ORDER BY started_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const drives = await db.prepare(query).bind(...params).all();
    const count = await db.prepare(`SELECT COUNT(*) as total FROM drives ${vehicleId ? 'WHERE vehicle_id = ?' : ''}`).bind(...(vehicleId ? [vehicleId] : [])).first();

    return c.json({
      drives: drives.results || [],
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

drivesRouter.get('/:id', async (c) => {
  try {
    const db = c.env?.TESLA_DB;
    if (!db) {
      return c.json({ error: 'Database not available' }, 500);
    }

    const id = c.req.param('id');
    const drive = await db.prepare(`SELECT * FROM drives WHERE id = ? OR tessie_id = ?`).bind(id, id).first();

    if (!drive) {
      return c.json({ error: 'Drive not found' }, 404);
    }

    return c.json(drive);
  } catch (error) {
    return c.json({ error: (error as any)?.message }, 500);
  }
});
