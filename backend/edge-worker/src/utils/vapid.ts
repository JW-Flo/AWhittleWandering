import { b64urlDecodeToBytes, b64urlEncodeBytes, b64urlEncodeJson } from './base64url';

function jwkFromVapid(publicKeyB64Url: string, privateKeyB64Url: string): JsonWebKey {
  const pub = b64urlDecodeToBytes(publicKeyB64Url);
  // Expect uncompressed P-256 public key: 65 bytes: 0x04 || X(32) || Y(32)
  if (pub.length !== 65 || pub[0] !== 0x04) {
    throw new Error('Invalid VAPID_PUBLIC_KEY format (expected uncompressed P-256 key)');
  }
  const x = pub.slice(1, 33);
  const y = pub.slice(33, 65);
  const d = b64urlDecodeToBytes(privateKeyB64Url);
  if (d.length !== 32) throw new Error('Invalid VAPID_PRIVATE_KEY format (expected 32-byte raw key)');
  return {
    kty: 'EC',
    crv: 'P-256',
    x: b64urlEncodeBytes(x),
    y: b64urlEncodeBytes(y),
    d: b64urlEncodeBytes(d),
    ext: true,
  };
}

export async function makeVapidAuthorization(
  endpoint: string,
  subject: string,
  vapidPublicKeyB64Url: string,
  vapidPrivateKeyB64Url: string
): Promise<{ authorization: string; cryptoKey: string }> {
  const url = new URL(endpoint);
  const aud = `${url.protocol}//${url.host}`;
  const nowSec = Math.floor(Date.now() / 1000);
  const exp = nowSec + 60 * 60; // 1h

  const header = { alg: 'ES256', typ: 'JWT' };
  const payload = { aud, exp, sub: subject };
  const data = `${b64urlEncodeJson(header)}.${b64urlEncodeJson(payload)}`;

  const jwk = jwkFromVapid(vapidPublicKeyB64Url, vapidPrivateKeyB64Url);
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const sigDer = await crypto.subtle.sign(
    { name: 'ECDSA', hash: { name: 'SHA-256' } },
    key,
    new TextEncoder().encode(data)
  );

  const jwt = `${data}.${b64urlEncodeBytes(sigDer)}`;

  // RFC8292 header form
  const authorization = `vapid t=${jwt}, k=${vapidPublicKeyB64Url}`;
  const cryptoKey = `p256ecdsa=${vapidPublicKeyB64Url}`;
  return { authorization, cryptoKey };
}








