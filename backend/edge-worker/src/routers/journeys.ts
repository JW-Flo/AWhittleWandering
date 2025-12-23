/**
 * Journey Management API Router
 * 
 * Handles journey creation, provisioning, and management.
 * Each journey gets its own D1 database and R2 bucket.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { JourneyProvisioningService } from '../services/journeyProvisioning';
import { logger } from '../utils/log';

interface JourneyEnv {
  TESLA_DB: D1Database;
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_API_TOKEN?: string;
  JWT_SECRET?: string;
}

export const journeysRouter = new Hono<{ Bindings: JourneyEnv }>();

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

/**
 * GET /api/v1/journeys
 * List all journeys for the authenticated user
 */
journeysRouter.get('/', async (c) => {
  // TODO: Get user_id from auth token
  // For now, use a query param or default
  const userId = c.req.query('user_id') || 'default-user';
  
  const provisioner = new JourneyProvisioningService(c.env);
  const journeys = await provisioner.listUserJourneys(userId);
  
  return c.json({
    success: true,
    journeys,
    count: journeys.length,
  });
});

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
journeysRouter.post('/', async (c) => {
  // Validate request body
  let body;
  try {
    const json = await c.req.json();
    const result = createJourneySchema.safeParse(json);
    if (!result.success) {
      return c.json({ 
        success: false, 
        error: 'Validation failed', 
        issues: result.error.issues 
      }, 400);
    }
    body = result.data;
  } catch {
    return c.json({ success: false, error: 'Invalid JSON body' }, 400);
  }

  const provisioner = new JourneyProvisioningService(c.env);
  
  // Check if provisioning is configured
  if (!provisioner.isConfigured()) {
    return c.json({ 
      success: false, 
      error: 'Resource provisioning not configured. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN secrets.',
      code: 'PROVISIONING_NOT_CONFIGURED'
    }, 503);
  }

  // TODO: Get user_id from auth token
  const userId = c.req.query('user_id') || 'default-user';

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
});

/**
 * PATCH /api/v1/journeys/:id
 * Update journey configuration
 */
journeysRouter.patch('/:id', async (c) => {
  const journeyId = c.req.param('id');
  
  let body;
  try {
    const json = await c.req.json();
    const result = updateJourneySchema.safeParse(json);
    if (!result.success) {
      return c.json({ 
        success: false, 
        error: 'Validation failed', 
        issues: result.error.issues 
      }, 400);
    }
    body = result.data;
  } catch {
    return c.json({ success: false, error: 'Invalid JSON body' }, 400);
  }

  const provisioner = new JourneyProvisioningService(c.env);
  const journey = await provisioner.getJourney(journeyId);
  
  if (!journey) {
    return c.json({ success: false, error: 'Journey not found' }, 404);
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
});

/**
 * DELETE /api/v1/journeys/:id
 * Delete a journey and its resources
 */
journeysRouter.delete('/:id', async (c) => {
  const journeyId = c.req.param('id');
  const forceDelete = c.req.query('force') === 'true';
  
  const provisioner = new JourneyProvisioningService(c.env);
  const journey = await provisioner.getJourney(journeyId);
  
  if (!journey) {
    return c.json({ success: false, error: 'Journey not found' }, 404);
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

