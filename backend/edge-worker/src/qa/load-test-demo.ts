/**
 * Lightweight load/probe script (dev only) to exercise key endpoints sequentially.
 * Usage: node dist/qa/load-test-demo.js (after build) OR ts-node src/qa/load-test-demo.ts
 */
// Access environment via globalThis to remain portable without depending on Node types
// @ts-ignore
const TARGET = (globalThis as any).API_BASE || 'http://127.0.0.1:8787';
const ENDPOINTS = [
  '/api/v1/health',
  '/api/v1/unified-data',
  '/api/v1/telemetry',
  '/api/v1/trip-status'
];

async function timeFetch(path: string) {
  const url = TARGET + path;
  const start = performance.now();
  const res = await fetch(url);
  const ms = Math.round(performance.now() - start);
  return { path, status: res.status, ms };
}

async function main() {
  // @ts-ignore
  const cycles = Number((globalThis as any).CYCLES || 3);
  const results: { path: string; status: number; ms: number }[] = [];
  for (let i = 0; i < cycles; i++) {
    for (const ep of ENDPOINTS) {
      try {
        const r = await timeFetch(ep);
        results.push(r);
      } catch (e: any) {
        // Record failure marker; include lightweight reason for observability
        results.push({ path: ep, status: 0, ms: -1 });
        console.warn('Request failed', ep, e?.message || e);
      }
    }
  }
  const byEp: Record<string, number[]> = {};
  results.forEach(r => {
    byEp[r.path] ||= []; byEp[r.path].push(r.ms);
  });
  function stats(arr: number[]) {
    const filt = arr.filter(v => v >= 0).sort((a,b)=>a-b);
    if (!filt.length) return { count: 0, p50: 0, p95: 0, max: 0 };
    const p = (q:number)=>filt[Math.min(filt.length-1, Math.floor(q*filt.length))];
    return { count: filt.length, p50: p(0.5), p95: p(0.95), max: filt[filt.length-1] };
  }
  console.log('Load Test Summary (', TARGET, ')');
  for (const ep of Object.keys(byEp)) {
    const s = stats(byEp[ep]);
    console.log(ep, s);
  }
}

main().catch(e => { console.error(e); });
