import { verifyJwtHS256 } from '../utils/jwtHs256';

export type AuthUser = {
  id: string;
  email?: string;
  admin?: boolean;
  mfa?: boolean;
  role?: string;
};

export async function requireUser(c: any, next: any) {
  const jwtCur = String(c.env?.JWT_SECRET || '').trim();
  const jwtPrev = String(c.env?.JWT_SECRET_PREVIOUS || '').trim();
  const secrets = [jwtCur, jwtPrev].filter(Boolean);
  if (!secrets.length) return c.json({ ok: false, error: 'Auth not configured' }, 500);

  const authz = c.req.header('Authorization') || '';
  if (!authz.startsWith('Bearer ')) return c.json({ ok: false, error: 'Missing bearer token' }, 401);
  const token = authz.slice(7).trim();

  const verified = await verifyJwtHS256(token, secrets);
  if (!verified.ok) return c.json({ ok: false, error: 'Invalid token' }, 401);

  const p: any = verified.payload || {};
  const id = String(p.sub || '').trim();
  if (!id) return c.json({ ok: false, error: 'Invalid token payload' }, 401);

  c.set('user', {
    id,
    email: typeof p.email === 'string' ? p.email : undefined,
    admin: p.admin === true || p.role === 'admin',
    mfa: p.mfa === true,
    role: typeof p.role === 'string' ? p.role : undefined,
  } satisfies AuthUser);

  await next();
}


