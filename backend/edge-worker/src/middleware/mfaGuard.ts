/**
 * MFA enforcement:
 * - Admins must have verified MFA.
 * - Journey owners (users with >= 1 journey) must have verified MFA.
 *
 * Routes can opt out by not using this middleware.
 */

export async function requireMfaIfNeeded(c: any, next: any) {
  const user = c.get('user');
  if (!user?.id) return c.json({ ok: false, error: 'Missing user context' }, 500);

  const db = c.env?.TESLA_DB;
  if (!db) return c.json({ ok: false, error: 'Database not configured' }, 500);

  const u = await db
    .prepare(`SELECT is_admin as is_admin, role as role FROM users WHERE id = ?`)
    .bind(user.id)
    .first<any>();
  const role = String(u?.role || '');
  const isAdmin = !!u?.is_admin || role === 'admin' || role === 'owner';

  const j = await db
    .prepare(`SELECT COUNT(1) as cnt FROM journey_registry WHERE user_id = ? AND status != 'deleted'`)
    .bind(user.id)
    .first<any>();
  const journeyCount = Number(j?.cnt || 0);
  const isJourneyOwner = journeyCount > 0;

  if (!isAdmin && !isJourneyOwner) {
    await next();
    return;
  }

  const f = await db
    .prepare(
      `SELECT 1 as ok FROM mfa_factors
       WHERE user_id = ? AND revoked_at IS NULL AND verified_at IS NOT NULL
       LIMIT 1`
    )
    .bind(user.id)
    .first<any>();
  const hasMfa = !!f?.ok;

  if (!hasMfa) {
    return c.json(
      {
        ok: false,
        code: 'mfa_required',
        reason: isAdmin ? 'admin' : 'journey_owner',
        message: 'Multi-factor authentication is required for this account.',
      },
      403
    );
  }

  await next();
}


