/**
 * Journey Management API Router
 *
 * Handles journey creation, provisioning, and management.
 * Each journey gets its own D1 database and R2 bucket.
 */

import { Hono } from 'hono';
import type { AppContext } from '../types/env';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { JourneyProvisioningService } from '../services/journeyProvisioning';
import { logger } from '../utils/log';
import { requireUser } from '../middleware/userAuth';

export const journeysRouter = new Hono<AppContext>();

// Request validation schemas
const createJourneySchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  vehicle_vin: z.string().length(17).optional(),
  tessie_api_key: z.string().min(10).optional(),
  start_date: z.string().optional(), // ISO date
  target_states: z.number().min(1).max(50).default(48),
});

const updateJourneySchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(500).optional(),
  vehicle_vin: z.string().length(17).optional(),
  tessie_api_key: z.string().min(10).optional(),
});

const followPrefsSchema = z.object({
  notify_waypoints: z.boolean().optional(),
  notify_state_crossings: z.boolean().optional(),
  notify_photos: z.boolean().optional(),
  notify_charging: z.boolean().optional(),
  notify_security: z.boolean().optional(),
});

const idParamSchema = z.object({
  id: z.string().min(1),
});

/**
 * GET /api/v1/journeys
 * List all journeys for the authenticated user
 */
journeysRouter.get('/', requireUser, async (c) => {
  const user = c.get('user');
  const userId = user.id;

  const provisioner = new JourneyProvisioningService(c.env);
  const journeys = await provisioner.listUserJourneys(userId);

  return c.json({
    success: true,
    journeys,
    count: journeys.length,
  });
});

// =====================================================
// Journey follow + per-journey notification settings (signed-in users only)
// =====================================================

journeysRouter.post('/:id/follow', requireUser, async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) return c.json({ ok: false, error: 'Database not configured' }, 500);
  const user = c.get('user');
  const journeyId = c.req.param('id');

  // Ensure journey exists
  const journey = await db.prepare(`SELECT id FROM journey_registry WHERE id = ? AND status != 'deleted'`).bind(journeyId).first<any>();
  if (!journey?.id) return c.json({ ok: false, error: 'Journey not found' }, 404);

  const followId = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO journey_follows (id, journey_id, user_id, created_at, unfollowed_at)
       VALUES (?, ?, ?, datetime('now'), NULL)
       ON CONFLICT(journey_id, user_id) DO UPDATE SET unfollowed_at=NULL`
    )
    .bind(followId, journeyId, user.id)
    .run();

  // Default prefs if missing
  await db
    .prepare(
      `INSERT INTO journey_follow_notification_prefs
        (journey_id, user_id, notify_waypoints, notify_state_crossings, notify_photos, notify_charging, notify_security, created_at, updated_at)
       VALUES (?, ?, 1, 1, 1, 0, 1, datetime('now'), datetime('now'))
       ON CONFLICT(journey_id, user_id) DO NOTHING`
    )
    .bind(journeyId, user.id)
    .run();

  // Get follower count
  const countResult = await db
    .prepare(`SELECT COUNT(*) as count FROM journey_follows WHERE journey_id = ? AND unfollowed_at IS NULL`)
    .bind(journeyId)
    .first<{ count: number }>();
  const followerCount = countResult?.count ?? 0;

  return c.json({ ok: true, following: true, followerCount });
});

journeysRouter.post('/:id/unfollow', requireUser, async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) return c.json({ ok: false, error: 'Database not configured' }, 500);
  const user = c.get('user');
  const journeyId = c.req.param('id');

  await db
    .prepare(`UPDATE journey_follows SET unfollowed_at = datetime('now') WHERE journey_id = ? AND user_id = ?`)
    .bind(journeyId, user.id)
    .run();

  // Get follower count
  const countResult = await db
    .prepare(`SELECT COUNT(*) as count FROM journey_follows WHERE journey_id = ? AND unfollowed_at IS NULL`)
    .bind(journeyId)
    .first<{ count: number }>();
  const followerCount = countResult?.count ?? 0;

  return c.json({ ok: true, following: false, followerCount });
});

journeysRouter.get('/:id/follow/settings', requireUser, async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) return c.json({ ok: false, error: 'Database not configured' }, 500);
  const user = c.get('user');
  const journeyId = c.req.param('id');

  const follow = await db
    .prepare(`SELECT unfollowed_at FROM journey_follows WHERE journey_id = ? AND user_id = ? LIMIT 1`)
    .bind(journeyId, user.id)
    .first<any>();
  const following = !!follow && !follow.unfollowed_at;

  const prefs = await db
    .prepare(
      `SELECT notify_waypoints, notify_state_crossings, notify_photos, notify_charging, notify_security
       FROM journey_follow_notification_prefs
       WHERE journey_id = ? AND user_id = ? LIMIT 1`
    )
    .bind(journeyId, user.id)
    .first<any>();

  // Get follower count
  const countResult = await db
    .prepare(`SELECT COUNT(*) as count FROM journey_follows WHERE journey_id = ? AND unfollowed_at IS NULL`)
    .bind(journeyId)
    .first<{ count: number }>();
  const followerCount = countResult?.count ?? 0;

  return c.json({
    ok: true,
    following,
    followerCount,
    prefs: prefs || {
      notify_waypoints: 1,
      notify_state_crossings: 1,
      notify_photos: 1,
      notify_charging: 0,
      notify_security: 1,
    },
  });
});

journeysRouter.put(
  '/:id/follow/settings',
  requireUser,
  zValidator('json', followPrefsSchema),
  async (c) => {
    const db = c.env?.TESLA_DB;
    if (!db) return c.json({ ok: false, error: 'Database not configured' }, 500);
    const user = c.get('user');
    const journeyId = c.req.param('id');
    const body = c.req.valid('json');

    // Upsert with partial updates (read current then overwrite provided)
    const existing = await db
      .prepare(
        `SELECT notify_waypoints, notify_state_crossings, notify_photos, notify_charging, notify_security
         FROM journey_follow_notification_prefs
         WHERE journey_id = ? AND user_id = ? LIMIT 1`
      )
      .bind(journeyId, user.id)
      .first<any>();
    const merged = {
      notify_waypoints: body.notify_waypoints ?? (existing ? !!existing.notify_waypoints : true),
      notify_state_crossings: body.notify_state_crossings ?? (existing ? !!existing.notify_state_crossings : true),
      notify_photos: body.notify_photos ?? (existing ? !!existing.notify_photos : true),
      notify_charging: body.notify_charging ?? (existing ? !!existing.notify_charging : false),
      notify_security: body.notify_security ?? (existing ? !!existing.notify_security : true),
    };

    await db
      .prepare(
        `INSERT INTO journey_follow_notification_prefs
          (journey_id, user_id, notify_waypoints, notify_state_crossings, notify_photos, notify_charging, notify_security, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
         ON CONFLICT(journey_id, user_id) DO UPDATE SET
           notify_waypoints=excluded.notify_waypoints,
           notify_state_crossings=excluded.notify_state_crossings,
           notify_photos=excluded.notify_photos,
           notify_charging=excluded.notify_charging,
           notify_security=excluded.notify_security,
           updated_at=datetime('now')`
      )
      .bind(
        journeyId,
        user.id,
        merged.notify_waypoints ? 1 : 0,
        merged.notify_state_crossings ? 1 : 0,
        merged.notify_photos ? 1 : 0,
        merged.notify_charging ? 1 : 0,
        merged.notify_security ? 1 : 0
      )
      .run();

    return c.json({ ok: true, prefs: merged });
  }
);

/**
 * GET /api/v1/journeys/:id
 * Get a specific journey
 */
journeysRouter.get('/:id', async (c) => {
  const journeyId = c.req.param('id');

  const provisioner = new JourneyProvisioningService(c.env);
  const journey = await provisioner.getJourney(journeyId);

  if (!journey) {
    return c.json({ success: false, error: 'Journey not found' }, 404);
  }

  // Mask sensitive data
  const sanitized = {
    ...journey,
    tessie_api_key: journey.tessie_api_key ? '***' + journey.tessie_api_key.slice(-4) : null,
  };

  return c.json({
    success: true,
    journey: sanitized,
  });
});

/**
 * POST /api/v1/journeys
 * Create a new journey and provision resources
 */
journeysRouter.post(
  '/',
  requireUser,
  zValidator('json', createJourneySchema),
  async (c) => {
    const body = c.req.valid('json');
    const provisioner = new JourneyProvisioningService(c.env);

    // Check if provisioning is configured
    if (!provisioner.isConfigured()) {
      return c.json({
        success: false,
        error: 'Resource provisioning not configured. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN secrets.',
        code: 'PROVISIONING_NOT_CONFIGURED'
      }, 503);
    }

    // Get user_id from authenticated token
    const user = c.get('user');
    const userId = user.id;

    // Register the journey
    const journey = await provisioner.registerJourney(userId, body.name, {
      description: body.description,
      vehicleVin: body.vehicle_vin,
      tessieApiKey: body.tessie_api_key,
    });

    if (!journey) {
      return c.json({
        success: false,
        error: 'Failed to register journey'
      }, 500);
    }

    // Provision resources (D1 + R2)
    const provisionResult = await provisioner.provisionJourney(journey.id);

    // Log the action
    await logAuditEvent(c.env.TESLA_DB, {
      user_id: userId,
      journey_id: journey.id,
      action: 'create_journey',
      details: JSON.stringify({
        name: body.name,
        provisioning_success: provisionResult.success,
        d1_created: !!provisionResult.d1_database_id,
        r2_created: !!provisionResult.r2_bucket_name,
      }),
    });

    if (!provisionResult.success) {
      return c.json({
        success: false,
        error: 'Journey created but resource provisioning failed',
        journey_id: journey.id,
        provisioning_errors: provisionResult.errors,
      }, 207); // Multi-Status
    }

    return c.json({
      success: true,
      journey: {
        id: journey.id,
        name: journey.name,
        status: 'active',
        resources: {
          d1_database_id: provisionResult.d1_database_id,
          d1_database_name: provisionResult.d1_database_name,
          r2_bucket_name: provisionResult.r2_bucket_name,
        },
      },
      message: 'Journey created and resources provisioned successfully',
    }, 201);
  }
);

/**
 * PATCH /api/v1/journeys/:id
 * Update journey configuration
 */
journeysRouter.patch(
  '/:id',
  requireUser,
  zValidator('json', updateJourneySchema),
  async (c) => {
    const journeyId = c.req.param('id');
    const user = c.get('user');
    const body = c.req.valid('json');

    const provisioner = new JourneyProvisioningService(c.env);
    const journey = await provisioner.getJourney(journeyId);

    if (!journey) {
      return c.json({ success: false, error: 'Journey not found' }, 404);
    }

    // Verify user owns this journey
    if (journey.user_id !== user.id) {
      return c.json({ success: false, error: 'Unauthorized to modify this journey' }, 403);
    }

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];

    if (body.name) {
      updates.push('name = ?');
      values.push(body.name);
    }
    if (body.description !== undefined) {
      updates.push('description = ?');
      values.push(body.description);
    }
    if (body.vehicle_vin) {
      updates.push('vehicle_vin = ?');
      values.push(body.vehicle_vin);
    }
    if (body.tessie_api_key) {
      updates.push('tessie_api_key = ?');
      values.push(body.tessie_api_key);
    }

    if (updates.length === 0) {
      return c.json({ success: false, error: 'No fields to update' }, 400);
    }

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(journeyId);

    await c.env.TESLA_DB.prepare(`
      UPDATE journey_registry SET ${updates.join(', ')} WHERE id = ?
    `).bind(...values).run();

    return c.json({
      success: true,
      message: 'Journey updated',
    });
  }
);

/**
 * DELETE /api/v1/journeys/:id
 * Delete a journey and its resources
 */
journeysRouter.delete('/:id', requireUser, async (c) => {
  const journeyId = c.req.param('id');
  const forceDelete = c.req.query('force') === 'true';
  const user = c.get('user');

  const provisioner = new JourneyProvisioningService(c.env);
  const journey = await provisioner.getJourney(journeyId);

  if (!journey) {
    return c.json({ success: false, error: 'Journey not found' }, 404);
  }

  // Verify user owns this journey
  if (journey.user_id !== user.id) {
    return c.json({ success: false, error: 'Unauthorized to delete this journey' }, 403);
  }

  if (journey.status === 'deleted') {
    return c.json({ success: false, error: 'Journey already deleted' }, 410);
  }

  // Require force flag for active journeys
  if (journey.status === 'active' && !forceDelete) {
    return c.json({
      success: false,
      error: 'Journey is active. Use ?force=true to delete.',
      code: 'ACTIVE_JOURNEY'
    }, 400);
  }

  const deleted = await provisioner.deleteJourney(journeyId);

  // Log the action
  await logAuditEvent(c.env.TESLA_DB, {
    user_id: journey.user_id,
    journey_id: journeyId,
    action: 'delete_journey',
    details: JSON.stringify({ force: forceDelete, success: deleted }),
  });

  return c.json({
    success: deleted,
    message: deleted ? 'Journey and resources deleted' : 'Journey marked as deleted but some resources may remain',
  });
});

/**
 * POST /api/v1/journeys/:id/provision
 * Retry provisioning for a failed journey
 */
journeysRouter.post('/:id/provision', async (c) => {
  const journeyId = c.req.param('id');

  const provisioner = new JourneyProvisioningService(c.env);
  const journey = await provisioner.getJourney(journeyId);

  if (!journey) {
    return c.json({ success: false, error: 'Journey not found' }, 404);
  }

  if (journey.status === 'active') {
    return c.json({
      success: false,
      error: 'Journey already provisioned',
      resources: {
        d1_database_id: journey.d1_database_id,
        r2_bucket_name: journey.r2_bucket_name,
      }
    }, 400);
  }

  const result = await provisioner.provisionJourney(journeyId);

  return c.json({
    success: result.success,
    journey_id: journeyId,
    resources: {
      d1_database_id: result.d1_database_id,
      d1_database_name: result.d1_database_name,
      r2_bucket_name: result.r2_bucket_name,
    },
    errors: result.errors.length > 0 ? result.errors : undefined,
  });
});

/**
 * GET /api/v1/journeys/:id/status
 * Get provisioning status
 */
journeysRouter.get('/:id/status', async (c) => {
  const journeyId = c.req.param('id');

  const provisioner = new JourneyProvisioningService(c.env);
  const journey = await provisioner.getJourney(journeyId);

  if (!journey) {
    return c.json({ success: false, error: 'Journey not found' }, 404);
  }

  return c.json({
    success: true,
    journey_id: journeyId,
    status: journey.status,
    resources: {
      d1_configured: !!journey.d1_database_id,
      d1_database_name: journey.d1_database_name,
      r2_configured: !!journey.r2_bucket_name,
      r2_bucket_name: journey.r2_bucket_name,
    },
    tessie_configured: !!journey.tessie_api_key,
    created_at: journey.created_at,
    updated_at: journey.updated_at,
  });
});

// Helper function to log audit events
async function logAuditEvent(
  db: D1Database,
  event: {
    user_id?: string;
    journey_id?: string;
    action: string;
    details?: string;
    ip_address?: string;
    user_agent?: string;
  }
): Promise<void> {
  try {
    await db.prepare(`
      INSERT INTO platform_audit_log (user_id, journey_id, action, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      event.user_id || null,
      event.journey_id || null,
      event.action,
      event.details || null,
      event.ip_address || null,
      event.user_agent || null
    ).run();
  } catch (error) {
    logger.warn('Failed to log audit event', { error, action: event.action });
  }
}
