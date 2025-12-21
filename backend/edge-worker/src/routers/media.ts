import { Hono } from 'hono';

export const mediaRouter = new Hono();

mediaRouter.get('/', async (c) => {
  try {
    const db = c.env?.TESLA_DB;
    if (!db) {
      return c.json({ error: 'Database not available' }, 500);
    }

    const limit = Math.min(Number(c.req.query('limit') || 20), 100);
    const offset = Number(c.req.query('offset') || 0);
    const vehicleId = c.req.query('vehicleId');
    const type = c.req.query('type');

    let query = `SELECT * FROM media`;
    const params: any[] = [];
    const conditions: string[] = [];

    if (vehicleId) {
      conditions.push(`vehicle_id = ?`);
      params.push(vehicleId);
    }
    
    if (type) {
        conditions.push(`mime_type LIKE ?`);
        params.push(`${type}%`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const media = await db.prepare(query).bind(...params).all();
    
    let countQuery = `SELECT COUNT(*) as total FROM media`;
    if (conditions.length > 0) {
        countQuery += ` WHERE ` + conditions.join(' AND ');
    }
    // const count = await db.prepare(countQuery).bind(...params.slice(0, params.length - 2)).first(); // remove limit/offset params

    return c.json({
      media: media.results || [],
      // count: (count as any)?.total || 0,
      limit,
      offset
    });
  } catch (error) {
    return c.json({ error: (error as any)?.message }, 500);
  }
});

mediaRouter.get('/:id', async (c) => {
  try {
    const db = c.env?.TESLA_DB;
    if (!db) {
      return c.json({ error: 'Database not available' }, 500);
    }

    const id = c.req.param('id');
    const item = await db.prepare(`SELECT * FROM media WHERE id = ?`).bind(id).first();

    if (!item) {
      return c.json({ error: 'Media not found' }, 404);
    }

    return c.json(item);
  } catch (error) {
    return c.json({ error: (error as any)?.message }, 500);
  }
});
