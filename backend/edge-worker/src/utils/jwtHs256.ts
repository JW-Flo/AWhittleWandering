function b64urlToBytes(s: string): Uint8Array {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToB64url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function jsonToB64url(obj: any): string {
  return bytesToB64url(new TextEncoder().encode(JSON.stringify(obj)));
}

function safeJsonParse(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

export async function signJwtHS256(payload: Record<string, any>, secret: string): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const h = jsonToB64url(header);
  const p = jsonToB64url(payload);
  const data = new TextEncoder().encode(`${h}.${p}`);

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, data));
  return `${h}.${p}.${bytesToB64url(sig)}`;
}

export async function verifyJwtHS256(token: string, secrets: string[], nowSec = Math.floor(Date.now() / 1000)) {
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false as const, reason: "format" };

  const [h, p, s] = parts;
  const headerJson = new TextDecoder().decode(b64urlToBytes(h));
  const payloadJson = new TextDecoder().decode(b64urlToBytes(p));
  const header = safeJsonParse(headerJson);
  const payload = safeJsonParse(payloadJson);
  if (!header || header.alg !== "HS256") return { ok: false as const, reason: "alg" };
  if (!payload || typeof payload !== "object") return { ok: false as const, reason: "payload" };

  const data = new TextEncoder().encode(`${h}.${p}`);
  const sig = b64urlToBytes(s);

  for (const secret of secrets) {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const ok = await crypto.subtle.verify("HMAC", key, sig, data);
    if (!ok) continue;

    // Standard time claims (best-effort)
    const exp = typeof payload.exp === "number" ? payload.exp : null;
    const nbf = typeof payload.nbf === "number" ? payload.nbf : null;
    if (nbf != null && nowSec < nbf) return { ok: false as const, reason: "nbf" };
    if (exp != null && nowSec >= exp) return { ok: false as const, reason: "exp" };

    return { ok: true as const, payload };
  }

  return { ok: false as const, reason: "sig" };
}



