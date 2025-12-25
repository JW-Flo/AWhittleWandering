import { Hono } from 'hono';
import { z } from 'zod';
import { requireUser } from '../middleware/userAuth';
import { logger } from '../utils/log';
import { generateTotpSecretBase32, buildOtpAuthUri, verifyTotpCode } from '../utils/totp';
import { openText, sealText } from '../utils/cryptoSeal';
import { sha256B64Url } from '../utils/sha256';
import { signJwtHS256 } from '../utils/jwtSignHs256';

export const mfaRouter = new Hono();

const enrollSchema = z.object({
  friendlyName: z.string().min(1).max(120).optional(),
});

const verifySchema = z.object({
  factorId: z.string().min(10),
  code: z.string().min(6).max(12),
});

const challengeVerifySchema = z.object({
  challengeId: z.string().min(10),
  code: z.string().min(6).max(12),
});

function requireMfaKey(c: any): string | null {
  const k = String(c.env?.MFA_TOTP_ENCRYPTION_KEY || '').trim();
  return k || null;
}

async function issueJwt(c: any, userId: string, email: string, role: string, isAdmin: boolean) {
  const secret = String(c.env?.JWT_SECRET || '').trim();
  if (!secret) return null;
  const nowSec = Math.floor(Date.now() / 1000);
  return signJwtHS256(
    {
      iss: 'awhittlewandering',
      sub: userId,
      email,
      admin: isAdmin,
      role,
      mfa: true,
      iat: nowSec,
      exp: nowSec + 60 * 60 * 12,
    },
    secret
  );
}

/**
 * POST /api/v1/mfa/totp/enroll
 * Requires auth. Creates a pending TOTP factor and returns otpauth URI.
 */
mfaRouter.post('/totp/enroll', requireUser, async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) return c.json({ ok: false, error: 'Database not configured' }, 500);
  const key = requireMfaKey(c);
  if (!key) return c.json({ ok: false, error: 'MFA encryption key not configured' }, 500);

  let body: z.infer<typeof enrollSchema>;
  try {
    body = enrollSchema.parse(await c.req.json());
  } catch (e: any) {
    return c.json({ ok: false, error: 'Validation failed', issues: e?.issues }, 400);
  }

  const user = c.get('user');
  const u = await db.prepare(`SELECT email, role, is_admin FROM users WHERE id = ? LIMIT 1`).bind(user.id).first<any>();
  if (!u?.email) return c.json({ ok: false, error: 'User not found' }, 404);

  const secretBase32 = generateTotpSecretBase32();
  const issuer = 'AWhittleWandering';
  const accountName = String(u.email);
  const uri = buildOtpAuthUri(secretBase32, { issuer, accountName });
  const factorId = crypto.randomUUID();
  const secretEnc = await sealText(secretBase32, key);

  await db
    .prepare(
      `INSERT INTO mfa_factors (id, user_id, factor_type, friendly_name, secret_enc, created_at)
       VALUES (?, ?, 'totp', ?, ?, datetime('now'))`
    )
    .bind(factorId, user.id, body.friendlyName || 'Authenticator', secretEnc)
    .run();

  logger.info('mfa_totp_enroll', { userId: user.id, factorId });
  return c.json({ ok: true, factorId, uri });
});

/**
 * POST /api/v1/mfa/totp/verify
 * Verifies a pending factor. Returns recovery codes (once).
 */
mfaRouter.post('/totp/verify', requireUser, async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) return c.json({ ok: false, error: 'Database not configured' }, 500);
  const key = requireMfaKey(c);
  if (!key) return c.json({ ok: false, error: 'MFA encryption key not configured' }, 500);

  let body: z.infer<typeof verifySchema>;
  try {
    body = verifySchema.parse(await c.req.json());
  } catch (e: any) {
    return c.json({ ok: false, error: 'Validation failed', issues: e?.issues }, 400);
  }

  const user = c.get('user');
  const factor = await db
    .prepare(
      `SELECT id, secret_enc, verified_at, revoked_at
       FROM mfa_factors
       WHERE id = ? AND user_id = ? AND factor_type = 'totp'
       LIMIT 1`
    )
    .bind(body.factorId, user.id)
    .first<any>();

  if (!factor?.id || factor.revoked_at) return c.json({ ok: false, error: 'Factor not found' }, 404);
  if (factor.verified_at) return c.json({ ok: false, error: 'Factor already verified' }, 409);

  const secretBase32 = await openText(String(factor.secret_enc), key);
  if (!secretBase32) return c.json({ ok: false, error: 'Failed to decrypt secret' }, 500);

  const ok = await verifyTotpCode(secretBase32, body.code);
  if (!ok) return c.json({ ok: false, error: 'Invalid code' }, 400);

  await db
    .prepare(`UPDATE mfa_factors SET verified_at = datetime('now') WHERE id = ? AND user_id = ?`)
    .bind(body.factorId, user.id)
    .run();

  // Generate recovery codes (10), store hashes, return plaintext once
  const pepper = String(c.env?.RECOVERY_CODE_PEPPER || c.env?.MFA_TOTP_ENCRYPTION_KEY || '').trim();
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    const raw = crypto.getRandomValues(new Uint8Array(10));
    const code = Array.from(raw)
      .map((b) => (b % 36).toString(36))
      .join('')
      .slice(0, 10)
      .toUpperCase();
    const formatted = `${code.slice(0, 5)}-${code.slice(5)}`;
    codes.push(formatted);
  }

  for (const code of codes) {
    const codeHash = await sha256B64Url(`${pepper}:${user.id}:${code}`);
    await db
      .prepare(`INSERT INTO mfa_recovery_codes (id, user_id, code_hash, created_at) VALUES (?, ?, ?, datetime('now'))`)
      .bind(crypto.randomUUID(), user.id, codeHash)
      .run();
  }

  logger.info('mfa_totp_verify', { userId: user.id, factorId: body.factorId });
  return c.json({ ok: true, recoveryCodes: codes });
});

/**
 * POST /api/v1/mfa/challenge/verify
 * For admin login: verifies a KV-backed challenge and returns an MFA=true JWT.
 */
mfaRouter.post('/challenge/verify', async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) return c.json({ ok: false, error: 'Database not configured' }, 500);
  const key = requireMfaKey(c);
  if (!key) return c.json({ ok: false, error: 'MFA encryption key not configured' }, 500);
  const kv = c.env?.AUTH_TOKENS;
  if (!kv) return c.json({ ok: false, error: 'Auth challenge store not configured' }, 500);

  let body: z.infer<typeof challengeVerifySchema>;
  try {
    body = challengeVerifySchema.parse(await c.req.json());
  } catch (e: any) {
    return c.json({ ok: false, error: 'Validation failed', issues: e?.issues }, 400);
  }

  const stored = await kv.get(`mfa_challenge:${body.challengeId}`, { type: 'json' });
  if (!stored?.userId || !stored?.factorId) return c.json({ ok: false, error: 'Invalid or expired challenge' }, 400);

  const factor = await db
    .prepare(
      `SELECT secret_enc, revoked_at, verified_at
       FROM mfa_factors
       WHERE id = ? AND user_id = ? AND factor_type = 'totp'
       LIMIT 1`
    )
    .bind(String(stored.factorId), String(stored.userId))
    .first<any>();
  if (!factor?.secret_enc || factor.revoked_at || !factor.verified_at) {
    return c.json({ ok: false, error: 'Factor not valid' }, 400);
  }

  const secretBase32 = await openText(String(factor.secret_enc), key);
  if (!secretBase32) return c.json({ ok: false, error: 'Failed to decrypt secret' }, 500);
  const ok = await verifyTotpCode(secretBase32, body.code);
  if (!ok) return c.json({ ok: false, error: 'Invalid code' }, 400);

  // One-time use challenge
  await kv.delete(`mfa_challenge:${body.challengeId}`);

  const userRow = await db
    .prepare(`SELECT id, email, role, is_admin FROM users WHERE id = ? LIMIT 1`)
    .bind(String(stored.userId))
    .first<any>();
  if (!userRow?.id || !userRow?.email) return c.json({ ok: false, error: 'User not found' }, 404);

  const ownerEmail = String(c.env?.OWNER_EMAIL || 'joe@awhittlewandering.com').toLowerCase().trim();
  const role = String(userRow.role || (userRow.is_admin ? 'admin' : 'user'));
  const effectiveRole = String(userRow.email).toLowerCase().trim() === ownerEmail ? 'owner' : role;
  const isAdmin = !!userRow.is_admin || effectiveRole === 'admin' || effectiveRole === 'owner';

  const token = await issueJwt(c, userRow.id, userRow.email, effectiveRole, isAdmin);
  logger.info('mfa_challenge_verify', { userId: userRow.id });
  return c.json({ ok: true, token, user: { id: userRow.id, email: userRow.email, role: effectiveRole, admin: isAdmin } });
});









