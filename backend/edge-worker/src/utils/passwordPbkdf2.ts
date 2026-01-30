import { b64urlDecodeToBytes, b64urlEncodeBytes } from './base64url';

const ITERATIONS = 310_000;
const DK_LEN = 32;

export type PasswordRecord = {
  password_hash: string;
  password_salt: string;
  password_algo: 'pbkdf2_sha256_v1';
};

async function pbkdf2(password: string, saltBytes: Uint8Array): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes as BufferSource, iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    DK_LEN * 8
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<PasswordRecord> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const dk = await pbkdf2(password, salt);
  return {
    password_hash: b64urlEncodeBytes(dk),
    password_salt: b64urlEncodeBytes(salt),
    password_algo: 'pbkdf2_sha256_v1',
  };
}

export async function verifyPassword(password: string, record: PasswordRecord): Promise<boolean> {
  if (!record?.password_hash || !record?.password_salt) return false;
  if (record.password_algo !== 'pbkdf2_sha256_v1') return false;
  const salt = b64urlDecodeToBytes(record.password_salt);
  const dk = await pbkdf2(password, salt);
  const a = b64urlEncodeBytes(dk);
  // Constant-time compare (best-effort)
  if (a.length !== record.password_hash.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ record.password_hash.charCodeAt(i);
  return diff === 0;
}










