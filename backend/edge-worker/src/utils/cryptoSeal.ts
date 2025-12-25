import { b64urlDecodeToBytes, b64urlEncodeBytes } from './base64url';

type SealedV1 = { v: 1; iv: string; ct: string };

async function keyFromString(secret: string): Promise<CryptoKey> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
  return crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function sealText(plaintext: string, secret: string): Promise<string> {
  const key = await keyFromString(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  const blob: SealedV1 = { v: 1, iv: b64urlEncodeBytes(iv), ct: b64urlEncodeBytes(ct) };
  return JSON.stringify(blob);
}

export async function openText(sealed: string, secret: string): Promise<string | null> {
  let parsed: SealedV1;
  try {
    parsed = JSON.parse(sealed) as SealedV1;
  } catch {
    return null;
  }
  if (!parsed || parsed.v !== 1 || !parsed.iv || !parsed.ct) return null;
  const key = await keyFromString(secret);
  try {
    const pt = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: b64urlDecodeToBytes(parsed.iv) },
      key,
      b64urlDecodeToBytes(parsed.ct)
    );
    return new TextDecoder().decode(pt);
  } catch {
    return null;
  }
}









