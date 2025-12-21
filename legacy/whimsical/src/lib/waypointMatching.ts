import { JourneyWaypoint, journeyWaypoints } from '@/data/journeyRoute';

// Calculate distance between two GPS coordinates using Haversine formula
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Find the nearest waypoint to a given GPS coordinate
export function findNearestWaypoint(
  lat: number,
  lng: number,
  maxDistanceMiles: number = 50
): { waypoint: JourneyWaypoint; distance: number } | null {
  let nearestWaypoint: JourneyWaypoint | null = null;
  let minDistance = Infinity;

  for (const waypoint of journeyWaypoints) {
    const distance = calculateDistance(lat, lng, waypoint.lat, waypoint.lng);
    if (distance < minDistance && distance <= maxDistanceMiles) {
      minDistance = distance;
      nearestWaypoint = waypoint;
    }
  }

  if (nearestWaypoint) {
    return { waypoint: nearestWaypoint, distance: minDistance };
  }
  return null;
}

// Auto-match a batch of photos to waypoints based on their coordinates
export function autoMatchPhotosToWaypoints(
  photos: Array<{ id: string; lat: number | null; lng: number | null }>
): Map<string, JourneyWaypoint> {
  const matches = new Map<string, JourneyWaypoint>();

  for (const photo of photos) {
    if (photo.lat && photo.lng) {
      const match = findNearestWaypoint(photo.lat, photo.lng);
      if (match) {
        matches.set(photo.id, match.waypoint);
      }
    }
  }

  return matches;
}

// Get waypoints for consumer display - intelligent selection based on human patterns
export function getHighlightWaypoints(limit: number = 15): JourneyWaypoint[] {
  // Priority: highlights > start > charging (major) > regular waypoints
  const highlights = journeyWaypoints.filter(w => w.type === 'highlight');
  const starts = journeyWaypoints.filter(w => w.type === 'start');
  const charging = journeyWaypoints.filter(w => w.type === 'charging');
  const regular = journeyWaypoints.filter(w => w.type === 'waypoint');

  // Select based on human interest patterns:
  // 1. All highlights (iconic locations)
  // 2. Start point
  // 3. Major state crossings / charging stops with high elevation changes
  // 4. Geographically diverse regular waypoints

  const selected: JourneyWaypoint[] = [...starts, ...highlights];
  
  // Add charging stops at interesting elevations
  const interestingCharging = charging
    .filter(w => w.elevation && (w.elevation > 7000 || w.elevation < 100))
    .slice(0, 3);
  selected.push(...interestingCharging);

  // Fill remaining with geographically diverse waypoints
  const remaining = limit - selected.length;
  if (remaining > 0) {
    // Get waypoints from different states
    const statesUsed = new Set(selected.map(w => w.state));
    const diverseWaypoints = regular
      .filter(w => !statesUsed.has(w.state))
      .slice(0, remaining);
    selected.push(...diverseWaypoints);
  }

  // Sort by date order
  return selected.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateA - dateB;
  });
}

// Get unique states from waypoints
export function getStatesFromWaypoints(): string[] {
  const states = new Set(journeyWaypoints.map(w => w.state));
  return Array.from(states);
}
