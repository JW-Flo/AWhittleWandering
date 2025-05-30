export interface Env {
    APP_KV: KVNamespace;
    EDGE_HMAC_KEY: string;
}

// TextEncoder and TextDecoder are global in Cloudflare Workers

async function verifySignature(
    body: ArrayBuffer,
    key: string,
    signatureHeader: string | null
): Promise<boolean> {
    if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
        return false;
    }
    const signature = signatureHeader.slice(7);
    const keyData = new TextEncoder().encode(key);
    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    const expected = await crypto.subtle.sign("HMAC", cryptoKey, body);
    const expectedHex = Array.from(new Uint8Array(expected))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    const sigBytes = new Uint8Array(
        signature.match(/.{2}/g)!.map((byte) => parseInt(byte, 16))
    );
    const expBytes = new Uint8Array(
        expectedHex.match(/.{2}/g)!.map((byte) => parseInt(byte, 16))
    );
    if (sigBytes.length !== expBytes.length) {
        return false;
    }
    // timing safe compare
    let diff = 0;
    for (let i = 0; i < expBytes.length; i++) {
        diff |= expBytes[i] ^ sigBytes[i];
    }
    return diff === 0;
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const { method, headers } = request;
        const url = new URL(request.url);

        // CORS preflight
        if (method === "OPTIONS") {
            return new Response(null, {
                status: 204,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, X-Signature",
                },
            });
        }

        // POST: ingest event
        if (method === "POST" && url.pathname === "/") {
            const buf = await request.arrayBuffer();
            const signature = headers.get("X-Signature");
            if (!(await verifySignature(buf, env.EDGE_HMAC_KEY, signature))) {
                return new Response("Unauthorized", { status: 401 });
            }
            let data: any;
            try {
                data = JSON.parse(new TextDecoder().decode(buf));
            } catch {
                return new Response("Invalid JSON", { status: 400 });
            }
            if (!data.id) {
                return new Response("Missing id", { status: 400 });
            }
            await env.APP_KV.put(data.id, JSON.stringify(data));
            return new Response("Stored", {
                status: 200,
                headers: { "Access-Control-Allow-Origin": "*" },
            });
        }

        // GET: retrieve events
        if (method === "GET") {
            const id = url.searchParams.get("id");
            if (id) {
                const item = await env.APP_KV.get(id);
                if (!item) {
                    return new Response("Not Found", { status: 404 });
                }
                return new Response(item, {
                    status: 200,
                    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                });
            } else {
                const list = await env.APP_KV.list();
                const items = await Promise.all(
                    list.keys.map((k: { name: string }) => env.APP_KV.get(k.name))
                );
                return new Response(JSON.stringify(items), {
                    status: 200,
                    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                });
            }
        }

        return new Response("Method Not Allowed", { status: 405 });
    }
};
