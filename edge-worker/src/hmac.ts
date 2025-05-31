// verifySignature adapted from Cloudflare example (workers-oauth-provider)
export async function verify(body: string, sig: string, key: CryptoKey) {
    const data = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
    const hex = [...new Uint8Array(data)].map(b => b.toString(16).padStart(2, "0")).join("");
    return hex === sig;
}
