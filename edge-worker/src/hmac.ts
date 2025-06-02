// verifySignature adapted from Cloudflare example (workers-oauth-provider)
export async function verify(body: string | ArrayBuffer, sig: string, keyString: string): Promise<boolean> {
    // Remove the sha256= prefix if present
    const signature = sig.startsWith('sha256=') ? sig.slice(7) : sig;
    
    // Import the key
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(keyString),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    // Convert body to string if it's an ArrayBuffer
    const bodyStr = body instanceof ArrayBuffer ? 
        new TextDecoder().decode(body) : 
        body;

    // Calculate the signature
    const data = await crypto.subtle.sign(
        'HMAC', 
        key, 
        new TextEncoder().encode(bodyStr)
    );
    
    const hex = [...new Uint8Array(data)]
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    
    return hex === signature;
}
