interface GeocodeResult { address: string; /* eslint-disable @typescript-eslint/no-explicit-any */ raw?: any }
const memoryCache = new Map<string, GeocodeResult>();

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult> {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (memoryCache.has(key)) return memoryCache.get(key)!;
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'ContinentalUSA-Tesla-Tracker/1.0 (geocode)' } });
    if (!res.ok) { const fb = { address: key }; memoryCache.set(key, fb); return fb; }
    const data = await res.json();
    const address = formatAddress(data) || key;
    const result: GeocodeResult = { address, raw: data }; memoryCache.set(key, result); return result;
  } catch { const fb = { address: key }; memoryCache.set(key, fb); return fb; }
}

function formatAddress(data: any): string | null { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!data) return null; const a = data.address || {}; const parts: string[] = [];
  if (a.house_number && a.road) parts.push(`${a.house_number} ${a.road}`); else if (a.road) parts.push(a.road); else if (a.amenity) parts.push(a.amenity);
  if (a.city) parts.push(a.city); else if (a.town) parts.push(a.town); else if (a.village) parts.push(a.village);
  if (a.state) parts.push(a.state); return parts.length ? parts.join(', ') : null;
}
