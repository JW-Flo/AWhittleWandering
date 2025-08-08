/* JSON Schema validation for unified-data endpoint */
import schema from './unified-data.schema.json';
// Minimal dynamic import shim for Workers build environment not needed when run with ts-node
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function assert(cond: any, msg: string) { if (!cond) throw new Error(msg); }

async function main() {
  const base = (globalThis as any).BASE_URL || 'http://localhost:8787';
  const res = await fetch(base + '/api/v1/unified-data');
  assert(res.ok, 'unified-data response not ok');
  const json: any = await res.json();

  // Lightweight validator (avoid full lib in worker bundle): just ensure required properties & types
  const requiredRoot = (schema as any).required as string[];
  for (const key of requiredRoot) assert(key in json, `missing root key: ${key}`);

  const overview: any = json.overview;
  for (const k of (schema as any).properties.overview.required) assert(k in overview, `overview missing ${k}`);
  assert(typeof overview.tripName === 'string', 'tripName type');
  assert(typeof overview.vehicle === 'string', 'vehicle type');

  const currentStatus: any = json.currentStatus;
  assert(currentStatus && typeof currentStatus === 'object', 'currentStatus object');
  const timeline: any = json.timeline;
  assert(Array.isArray(timeline.drives), 'timeline.drives array');
  assert(Array.isArray(timeline.charges), 'timeline.charges array');

  console.log('[SCHEMA] unified-data basic schema PASS');
}

main().catch(err => { console.error('[SCHEMA] unified-data schema FAIL', err); });
