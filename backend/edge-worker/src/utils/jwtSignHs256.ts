import { b64urlEncodeBytes, b64urlEncodeJson } from './base64url';

export async function signJwtHS256(payload: Record<string, unknown>, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const h = b64urlEncodeJson(header);
  const p = b64urlEncodeJson(payload);
  const data = `${h}.${p}`;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return `${data}.${b64urlEncodeBytes(sig)}`;
}









