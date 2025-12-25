import { b64urlEncodeBytes } from './base64url';

export async function sha256B64Url(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return b64urlEncodeBytes(digest);
}


