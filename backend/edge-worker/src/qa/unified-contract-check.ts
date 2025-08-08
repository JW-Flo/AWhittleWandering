/* Quick contract QA script for unified data endpoint */
function assert(cond: any, msg: string) { if (!cond) throw new Error(msg); }

async function main() {
  const base = (globalThis as any).BASE_URL || 'http://localhost:8787';
  const res = await fetch(base + '/api/v1/unified-data');
  assert(res.ok, 'unified-data response not ok');
  const json: any = await res.json();
  for (const key of ['overview','currentStatus','timeline','tessieStatus']) assert(key in json, `missing section: ${key}`);
  const ov: any = json.overview;
  for (const k of ['tripName','vehicle','startDate','daysElapsed','totalMiles','currentOdometer','statesVisited','totalStates']) assert(k in ov, `overview missing ${k}`);
  const cs: any = json.currentStatus;
  assert(cs && cs.battery && cs.location && cs.vehicle, 'currentStatus incomplete');
  assert(Array.isArray(json.timeline?.drives), 'timeline.drives not array');
  assert(Array.isArray(json.timeline?.charges), 'timeline.charges not array');
  console.log('[QA] unified-data contract PASS', { drives: json.timeline.drives.length, charges: json.timeline.charges.length });
}

main().catch(err => { console.error('[QA] unified-data contract FAIL', err); });
