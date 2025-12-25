import { Hono } from 'hono';
import { z } from 'zod';
import { logger } from '../utils/log';
import { hashPassword, verifyPassword } from '../utils/passwordPbkdf2';
import { signJwtHS256 } from '../utils/jwtSignHs256';
import { requireUser } from '../middleware/userAuth';

type UserRow = {
  id: string;
  email: string;
  display_name: string | null;
  is_admin: number | boolean | null;
  role: string | null;
  password_hash: string | null;
  password_salt: string | null;
  password_algo: string | null;
};

const bodySchema = z.object({
  action: z.enum(['login', 'register']),
  email: z.string().email(),
  password: z.string().min(10).max(200),
  displayName: z.string().min(1).max(120).optional(),
});

async function issueJwt(c: any, user: { id: string; email: string; is_admin: boolean }, mfa: boolean) {
  const secret = String(c.env?.JWT_SECRET || '').trim();
  if (!secret) return null;
  const db = c.env?.TESLA_DB;
  const roleRow = db
    ? await db.prepare(`SELECT role, is_admin FROM users WHERE id = ? LIMIT 1`).bind(user.id).first<any>()
    : null;
  const role = String(roleRow?.role || (user.is_admin ? 'admin' : 'user'));
  const isAdmin = !!(roleRow?.is_admin || role === 'admin' || role === 'owner');
  const ownerEmail = String(c.env?.OWNER_EMAIL || 'joe@awhittlewandering.com').toLowerCase().trim();
  const effectiveRole = user.email.toLowerCase().trim() === ownerEmail ? 'owner' : role;
  const effectiveAdmin = effectiveRole === 'admin' || effectiveRole === 'owner' || isAdmin;
  const nowSec = Math.floor(Date.now() / 1000);
  return await signJwtHS256(
    {
      iss: 'awhittlewandering',
      sub: user.id,
      email: user.email,
      admin: effectiveAdmin,
      role: effectiveRole,
      mfa,
      iat: nowSec,
      exp: nowSec + 60 * 60 * 12, // 12h
    },
    secret
  );
}

export const authRouter = new Hono();

/**
 * POST /api/v1/auth
 * Body: { action: 'login'|'register', email, password, displayName? }
 *
 * Notes:
 * - Admin logins require TOTP MFA if a verified factor exists; otherwise must enroll first.
 * - Non-admin users can login without MFA, but MFA may be enforced on specific endpoints
 *   (admins, and journey owners) via middleware.
 */
authRouter.post('/', async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) return c.json({ ok: false, error: 'Database not configured' }, 500);

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await c.req.json());
  } catch (e: any) {
    return c.json({ ok: false, error: 'Validation failed', issues: e?.issues }, 400);
  }

  const email = body.email.toLowerCase().trim();

  if (body.action === 'register') {
    const id = crypto.randomUUID();
    const pw = await hashPassword(body.password);
    try {
      await db
        .prepare(
          `INSERT INTO users (id, email, display_name, is_active, is_admin, role, created_at, updated_at, password_hash, password_salt, password_algo, password_updated_at)
           VALUES (?, ?, ?, 1, 0, 'user', datetime('now'), datetime('now'), ?, ?, ?, datetime('now'))`
        )
        .bind(
          id,
          email,
          body.displayName || null,
          pw.password_hash,
          pw.password_salt,
          pw.password_algo
        )
        .run();
    } catch (err: any) {
      logger.warn('Register failed', { email, err: String(err?.message || err) });
      return c.json({ ok: false, error: 'Registration failed' }, 400);
    }

    const token = await issueJwt(c, { id, email, is_admin: false }, false);
    return c.json({ ok: true, action: 'register', token, user: { id, email, admin: false, role: 'user' } }, 201);
  }

  // login
  const user = await db
    .prepare(
      `SELECT id, email, display_name, is_admin, role, password_hash, password_salt, password_algo
       FROM users
       WHERE email = ? AND is_active = 1
       LIMIT 1`
    )
    .bind(email)
    .first<UserRow>();

  if (!user?.id || !user.password_hash || !user.password_salt || !user.password_algo) {
    return c.json({ ok: false, error: 'Invalid credentials' }, 401);
  }

  const ok = await verifyPassword(body.password, {
    password_hash: user.password_hash,
    password_salt: user.password_salt,
    password_algo: 'pbkdf2_sha256_v1',
  });
  if (!ok) return c.json({ ok: false, error: 'Invalid credentials' }, 401);

  // Update last_login_at (best-effort)
  c.executionCtx?.waitUntil?.(
    db
      .prepare(`UPDATE users SET last_login_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`)
      .bind(user.id)
      .run()
      .then(() => undefined)
  );

  // Compute effective role/admin (owner override)
  const ownerEmail = String(c.env?.OWNER_EMAIL || 'joe@awhittlewandering.com').toLowerCase().trim();
  const role = String(user.role || (user.is_admin ? 'admin' : 'user'));
  const effectiveRole = user.email.toLowerCase().trim() === ownerEmail ? 'owner' : role;
  const isAdmin = !!user.is_admin || effectiveRole === 'admin' || effectiveRole === 'owner';

  if (isAdmin) {
    // Admins must complete MFA. If no verified factor exists, require setup.
    const factor = await db
      .prepare(
        `SELECT id FROM mfa_factors
         WHERE user_id = ? AND revoked_at IS NULL AND verified_at IS NOT NULL
         LIMIT 1`
      )
      .bind(user.id)
      .first<any>();

    if (!factor?.id) {
      return c.json(
        { ok: false, code: 'mfa_setup_required', message: 'Admin accounts must enable TOTP MFA.' },
        403
      );
    }

    // Issue a short-lived MFA challenge stored in KV.
    const kv = c.env?.AUTH_TOKENS;
    if (!kv) return c.json({ ok: false, error: 'Auth challenge store not configured' }, 500);
    const challengeId = crypto.randomUUID();
    await kv.put(
      `mfa_challenge:${challengeId}`,
      JSON.stringify({ userId: user.id, factorId: factor.id, createdAt: Date.now() }),
      { expirationTtl: 300 }
    );
    return c.json({
      ok: true,
      action: 'login',
      mfaRequired: true,
      challengeId,
      factorType: 'totp',
      role: effectiveRole,
    });
  }

  const token = await issueJwt(c, { id: user.id, email: user.email, is_admin: isAdmin }, false);
  return c.json({
    ok: true,
    action: 'login',
    token,
    user: { id: user.id, email: user.email, admin: isAdmin, role: effectiveRole },
  });
});

/**
 * GET /api/v1/auth/me
 * Returns: role, journeyOwner, mfaEnabled, mfaRequired
 */
authRouter.get('/me', requireUser, async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) return c.json({ ok: false, error: 'Database not configured' }, 500);

  const user = c.get('user');
  const row = await db
    .prepare(`SELECT id, email, display_name, role, is_admin FROM users WHERE id = ? LIMIT 1`)
    .bind(user.id)
    .first<any>();
  if (!row?.id) return c.json({ ok: false, error: 'User not found' }, 404);

  const ownerEmail = String(c.env?.OWNER_EMAIL || 'joe@awhittlewandering.com').toLowerCase().trim();
  const baseRole = String(row.role || (row.is_admin ? 'admin' : 'user'));
  const role = String(row.email).toLowerCase().trim() === ownerEmail ? 'owner' : baseRole;
  const isAdmin = !!row.is_admin || role === 'admin' || role === 'owner';

  const j = await db
    .prepare(`SELECT COUNT(1) as cnt FROM journey_registry WHERE user_id = ? AND status != 'deleted'`)
    .bind(user.id)
    .first<any>();
  const journeyCount = Number(j?.cnt || 0);
  const journeyOwner = journeyCount > 0;

  const f = await db
    .prepare(
      `SELECT 1 as ok FROM mfa_factors
       WHERE user_id = ? AND revoked_at IS NULL AND verified_at IS NOT NULL
       LIMIT 1`
    )
    .bind(user.id)
    .first<any>();
  const mfaEnabled = !!f?.ok;

  const mfaRequired = isAdmin || journeyOwner;

  return c.json({
    ok: true,
    user: {
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      role,
      admin: isAdmin,
    },
    journeyOwner,
    mfaEnabled,
    mfaRequired,
  });
});


