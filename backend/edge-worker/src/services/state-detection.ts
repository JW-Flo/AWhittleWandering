/**
 * State Detection Service
 * Converts latitude/longitude coordinates to US state names and codes
 */

export interface StateDetectionResult {
  name: string;
  code: string;
  confidence: 'high' | 'medium' | 'low';
}

// Simplified US state boundaries (bounding boxes for basic detection)
// This is a fallback when reverse geocoding fails
const STATE_BOUNDARIES: Record<string, { name: string; bounds: [number, number, number, number] }> = {
  // Format: [minLng, minLat, maxLng, maxLat]
  AL: { name: 'Alabama', bounds: [-88.5, 30.1, -84.7, 35.0] },
  AK: { name: 'Alaska', bounds: [-179.1, 51.2, -129.9, 71.5] },
  AZ: { name: 'Arizona', bounds: [-114.8, 31.3, -109.0, 37.0] },
  AR: { name: 'Arkansas', bounds: [-94.6, 33.0, -89.6, 36.5] },
  CA: { name: 'California', bounds: [-124.4, 32.5, -114.1, 42.0] },
  CO: { name: 'Colorado', bounds: [-109.0, 36.9, -102.0, 41.0] },
  CT: { name: 'Connecticut', bounds: [-73.7, 40.9, -71.7, 42.0] },
  DE: { name: 'Delaware', bounds: [-75.8, 38.4, -75.0, 39.8] },
  FL: { name: 'Florida', bounds: [-87.6, 24.4, -79.8, 31.0] },
  GA: { name: 'Georgia', bounds: [-85.6, 30.3, -80.7, 35.0] },
  HI: { name: 'Hawaii', bounds: [-160.3, 18.8, -154.8, 22.3] },
  ID: { name: 'Idaho', bounds: [-117.2, 41.9, -111.0, 49.0] },
  IL: { name: 'Illinois', bounds: [-91.5, 36.9, -87.4, 42.5] },
  IN: { name: 'Indiana', bounds: [-88.1, 37.7, -84.6, 41.8] },
  IA: { name: 'Iowa', bounds: [-96.6, 40.3, -90.1, 43.5] },
  KS: { name: 'Kansas', bounds: [-102.0, 36.9, -94.5, 40.0] },
  KY: { name: 'Kentucky', bounds: [-89.5, 36.4, -81.9, 39.1] },
  LA: { name: 'Louisiana', bounds: [-94.0, 28.8, -88.7, 33.0] },
  ME: { name: 'Maine', bounds: [-71.0, 42.9, -66.9, 47.4] },
  MD: { name: 'Maryland', bounds: [-79.5, 37.8, -75.0, 39.7] },
  MA: { name: 'Massachusetts', bounds: [-73.5, 41.1, -69.9, 42.8] },
  MI: { name: 'Michigan', bounds: [-90.4, 41.6, -82.1, 48.3] },
  MN: { name: 'Minnesota', bounds: [-97.2, 43.4, -89.4, 49.4] },
  MS: { name: 'Mississippi', bounds: [-91.6, 30.1, -88.0, 35.0] },
  MO: { name: 'Missouri', bounds: [-95.8, 35.9, -89.0, 40.6] },
  MT: { name: 'Montana', bounds: [-116.0, 44.3, -104.0, 49.0] },
  NE: { name: 'Nebraska', bounds: [-104.0, 39.9, -95.2, 43.0] },
  NV: { name: 'Nevada', bounds: [-120.0, 35.0, -114.0, 42.0] },
  NH: { name: 'New Hampshire', bounds: [-72.5, 42.6, -70.6, 45.3] },
  NJ: { name: 'New Jersey', bounds: [-75.5, 38.9, -73.8, 41.3] },
  NM: { name: 'New Mexico', bounds: [-109.0, 31.3, -103.0, 37.0] },
  NY: { name: 'New York', bounds: [-79.8, 40.4, -71.7, 45.0] },
  NC: { name: 'North Carolina', bounds: [-84.3, 33.8, -75.3, 36.6] },
  ND: { name: 'North Dakota', bounds: [-104.0, 45.8, -96.4, 49.0] },
  OH: { name: 'Ohio', bounds: [-84.8, 38.4, -80.5, 42.3] },
  OK: { name: 'Oklahoma', bounds: [-103.0, 33.6, -94.4, 37.0] },
  OR: { name: 'Oregon', bounds: [-124.5, 41.9, -116.4, 46.3] },
  PA: { name: 'Pennsylvania', bounds: [-80.5, 39.7, -74.6, 42.5] },
  RI: { name: 'Rhode Island', bounds: [-71.9, 41.1, -71.1, 42.0] },
  SC: { name: 'South Carolina', bounds: [-83.3, 32.0, -78.5, 35.2] },
  SD: { name: 'South Dakota', bounds: [-104.0, 42.4, -96.3, 45.9] },
  TN: { name: 'Tennessee', bounds: [-90.3, 34.9, -81.6, 36.7] },
  TX: { name: 'Texas', bounds: [-106.6, 25.8, -93.4, 36.5] },
  UT: { name: 'Utah', bounds: [-114.0, 36.9, -109.0, 42.0] },
  VT: { name: 'Vermont', bounds: [-73.4, 42.7, -71.4, 45.0] },
  VA: { name: 'Virginia', bounds: [-83.6, 36.5, -75.1, 39.5] },
  WA: { name: 'Washington', bounds: [-124.8, 45.5, -116.9, 49.0] },
  WV: { name: 'West Virginia', bounds: [-82.6, 37.1, -77.7, 40.6] },
  WI: { name: 'Wisconsin', bounds: [-92.9, 42.4, -86.7, 47.3] },
  WY: { name: 'Wyoming', bounds: [-111.0, 40.9, -104.0, 45.0] },
  DC: { name: 'District of Columbia', bounds: [-77.1, 38.8, -76.9, 38.9] },
};

/**
 * Detect US state from latitude/longitude coordinates
 * Uses reverse geocoding as primary method, falls back to bounding box detection
 */
export async function detectStateFromCoordinates(
  latitude: number,
  longitude: number
): Promise<StateDetectionResult | null> {
  // Validate coordinates
  if (latitude < 24 || latitude > 50 || longitude < -125 || longitude > -65) {
    // Outside continental US bounds
    return null;
  }

  try {
    // Primary method: Reverse geocoding via Nominatim (OpenStreetMap)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'AWhittleWandering/1.0'
        }
      }
    );

    if (response.ok) {
      const data = await response.json() as { address?: { state?: string; region?: string; county?: string } };

      // Extract state information
      const address = data?.address;
      if (address) {
        // Try different possible state fields
        const stateName = address.state || address.region || address.county;
        if (stateName) {
          // Normalize state name and find code
          const normalizedName = stateName.toLowerCase();
          const stateEntry = Object.entries(STATE_BOUNDARIES).find(
            ([code, info]) => info.name.toLowerCase() === normalizedName
          );

          if (stateEntry) {
            return {
              name: stateEntry[1].name,
              code: stateEntry[0],
              confidence: 'high'
            };
          }
        }
      }
    }
  } catch (error) {
    console.warn('Reverse geocoding failed, falling back to bounding box detection:', error);
  }

  // Fallback: Bounding box detection
  for (const [code, stateInfo] of Object.entries(STATE_BOUNDARIES)) {
    const [minLng, minLat, maxLng, maxLat] = stateInfo.bounds;
    if (longitude >= minLng && longitude <= maxLng &&
        latitude >= minLat && latitude <= maxLat) {
      return {
        name: stateInfo.name,
        code,
        confidence: 'medium'
      };
    }
  }

  return null;
}

/**
 * Update states_visited table when a new state is detected
 */
export async function updateStatesVisited(
  db: any,
  journeyId: string,
  stateCode: string,
  stateName: string,
  latitude: number,
  longitude: number,
  driveId?: string
): Promise<void> {
  const now = new Date().toISOString();

  await db.prepare(`
    INSERT INTO states_visited (
      journey_id, state_name, state_code, first_visited_date,
      first_drive_id, visit_count, entry_latitude, entry_longitude,
      last_updated, created_at
    ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
    ON CONFLICT(journey_id, state_name) DO UPDATE SET
      visit_count = visit_count + 1,
      last_updated = ?
  `).bind(
    journeyId,
    stateName,
    stateCode,
    now, // first_visited_date
    driveId || null,
    latitude,
    longitude,
    now, // last_updated
    now, // created_at
    now  // last_updated (ON CONFLICT)
  ).run();
}

/**
 * Batch update states for multiple drives
 */
export async function batchUpdateDriveStates(
  db: any,
  journeyId: string,
  drives: Array<{ id: string; startLat: number; startLng: number; endLat: number; endLng: number }>
): Promise<void> {
  for (const drive of drives) {
    try {
      // Check start location
      const startState = await detectStateFromCoordinates(drive.startLat, drive.startLng);
      if (startState) {
        await updateStatesVisited(
          db,
          journeyId,
          startState.code,
          startState.name,
          drive.startLat,
          drive.startLng,
          drive.id
        );
      }

      // Check end location (if different from start)
      if (drive.endLat !== drive.startLat || drive.endLng !== drive.startLng) {
        const endState = await detectStateFromCoordinates(drive.endLat, drive.endLng);
        if (endState && endState.code !== startState?.code) {
          await updateStatesVisited(
            db,
            journeyId,
            endState.code,
            endState.name,
            drive.endLat,
            drive.endLng,
            drive.id
          );
        }
      }
    } catch (error) {
      console.error(`Failed to update state for drive ${drive.id}:`, error);
    }
  }
}