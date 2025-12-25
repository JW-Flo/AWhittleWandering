import { base32Decode, base32Encode } from './base32';

export type TotpConfig = {
  issuer: string;
  accountName: string;
  digits?: number;
  periodSec?: number;
};

export function generateTotpSecretBase32(): string {
  const secret = crypto.getRandomValues(new Uint8Array(20));
  return base32Encode(secret);
}

export function buildOtpAuthUri(secretBase32: string, cfg: TotpConfig): string {
  const digits = cfg.digits ?? 6;
  const periodSec = cfg.periodSec ?? 30;
  const label = `${cfg.issuer}:${cfg.accountName}`;
  const params = new URLSearchParams({
    secret: secretBase32,
    issuer: cfg.issuer,
    digits: String(digits),
    period: String(periodSec),
    algorithm: 'SHA1',
  });
  return `otpauth://totp/${encodeURIComponent(label)}?${params.toString()}`;
}

function toCounterBytes(counter: number): Uint8Array {
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  // Big-endian 64-bit counter (use two 32-bit writes)
  view.setUint32(0, Math.floor(counter / 2 ** 32));
  view.setUint32(4, counter >>> 0);
  return new Uint8Array(buf);
}

async function hmacSha1(keyBytes: Uint8Array, msgBytes: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, msgBytes);
  return new Uint8Array(sig);
}

async function hotp(secretBase32: string, counter: number, digits: number): Promise<string> {
  const key = base32Decode(secretBase32);
  const msg = toCounterBytes(counter);
  const mac = await hmacSha1(key, msg);
  const offset = mac[mac.length - 1] & 0x0f;
  const bin =
    ((mac[offset] & 0x7f) << 24) |
    ((mac[offset + 1] & 0xff) << 16) |
    ((mac[offset + 2] & 0xff) << 8) |
    (mac[offset + 3] & 0xff);
  const mod = 10 ** digits;
  return String(bin % mod).padStart(digits, '0');
}

export async function verifyTotpCode(secretBase32: string, code: string, nowMs = Date.now()): Promise<boolean> {
  const digits = 6;
  const periodSec = 30;
  const t = Math.floor(nowMs / 1000);
  const counter = Math.floor(t / periodSec);
  const normalized = String(code || '').replace(/\s+/g, '');
  if (!/^\d{6}$/.test(normalized)) return false;

  // Allow small drift window
  for (const delta of [-1, 0, 1]) {
    const expected = await hotp(secretBase32, counter + delta, digits);
    if (expected === normalized) return true;
  }
  return false;
}








