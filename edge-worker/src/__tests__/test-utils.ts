import { Miniflare } from 'miniflare';
import type { Location } from '../types';

export interface TestEnv {
    mf: Miniflare;
    mockLocations: {
        sf: Location;
        la: Location;
        nyc: Location;
    };
}

export const createTestEnv = async (): Promise<TestEnv> => {
    const mf = new Miniflare({
        scriptPath: "/Users/joe/Projects/Personal/ContinentalUSA/edge-worker/dist/worker.js",
        modules: true,
        kvPersist: true,
        kvNamespaces: ['MAP_TILES_KV', 'APP_KV'],
        bindings: {
            EDGE_HMAC_KEY: "test-key"
        },
        port: 8787
    });

    // Initialize KV with test static files
    const testHtml = `<!DOCTYPE html>
<html>
<head>
    <title>ContinentalUSA</title>
</head>
<body>
    <h1>Test Page</h1>
</body>
</html>`;

    const appKv = await mf.getKVNamespace('APP_KV');
    await appKv.put('/index.html', testHtml);

    const mockLocations = {
        sf: { latitude: 37.7749, longitude: -122.4194 },
        la: { latitude: 34.0522, longitude: -118.2437 },
        nyc: { latitude: 40.7128, longitude: -74.0060 }
    };

    return { mf, mockLocations };
};

export const cleanupTestEnv = async (env: TestEnv) => {
    await env.mf.dispose();
};

export async function calculateHmacSignature(body: unknown): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode('test-key'),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    
    const bodyBytes = encoder.encode(JSON.stringify(body));
    const signature = await crypto.subtle.sign('HMAC', key, bodyBytes);

    const hexString = Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    
    return `sha256=${hexString}`;
}
