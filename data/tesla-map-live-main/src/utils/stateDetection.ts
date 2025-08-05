// Comprehensive US state boundary detection system
export interface StateBoundary {
  name: string;
  abbreviation: string;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export const US_STATE_BOUNDARIES: StateBoundary[] = [
  { name: 'Alabama', abbreviation: 'AL', minLat: 30.2336, maxLat: 35.0041, minLng: -88.4734, maxLng: -84.8882 },
  { name: 'Alaska', abbreviation: 'AK', minLat: 51.2097, maxLat: 71.5388, minLng: -179.1506, maxLng: -129.9795 },
  { name: 'Arizona', abbreviation: 'AZ', minLat: 31.3322, maxLat: 37.0043, minLng: -114.8165, maxLng: -109.0452 },
  { name: 'Arkansas', abbreviation: 'AR', minLat: 33.0041, maxLat: 36.4996, minLng: -94.6178, maxLng: -89.6449 },
  { name: 'California', abbreviation: 'CA', minLat: 32.5343, maxLat: 42.0095, minLng: -124.4096, maxLng: -114.1308 },
  { name: 'Colorado', abbreviation: 'CO', minLat: 36.9924, maxLat: 41.0034, minLng: -109.0489, maxLng: -102.0424 },
  { name: 'Connecticut', abbreviation: 'CT', minLat: 40.9959, maxLat: 42.0508, minLng: -73.7277, maxLng: -71.7869 },
  { name: 'Delaware', abbreviation: 'DE', minLat: 38.4491, maxLat: 39.8394, minLng: -75.7890, maxLng: -75.0489 },
  { name: 'Florida', abbreviation: 'FL', minLat: 24.3963, maxLat: 31.0009, minLng: -87.6349, maxLng: -79.9740 },
  { name: 'Georgia', abbreviation: 'GA', minLat: 30.3552, maxLat: 35.0008, minLng: -85.6051, maxLng: -80.7519 },
  { name: 'Hawaii', abbreviation: 'HI', minLat: 18.9100, maxLat: 28.4017, minLng: -178.3347, maxLng: -154.8066 },
  { name: 'Idaho', abbreviation: 'ID', minLat: 41.9880, maxLat: 49.0011, minLng: -117.2431, maxLng: -111.0435 },
  { name: 'Illinois', abbreviation: 'IL', minLat: 36.9703, maxLat: 42.5089, minLng: -91.5130, maxLng: -87.0198 },
  { name: 'Indiana', abbreviation: 'IN', minLat: 37.7717, maxLat: 41.7613, minLng: -88.0972, maxLng: -84.7847 },
  { name: 'Iowa', abbreviation: 'IA', minLat: 40.3755, maxLat: 43.5012, minLng: -96.6397, maxLng: -90.1401 },
  { name: 'Kansas', abbreviation: 'KS', minLat: 36.9930, maxLat: 40.0031, minLng: -102.0517, maxLng: -94.5882 },
  { name: 'Kentucky', abbreviation: 'KY', minLat: 36.4971, maxLat: 39.1472, minLng: -89.5714, maxLng: -81.9649 },
  { name: 'Louisiana', abbreviation: 'LA', minLat: 28.8609, maxLat: 33.0194, minLng: -94.0432, maxLng: -88.7578 },
  { name: 'Maine', abbreviation: 'ME', minLat: 42.9179, maxLat: 47.4598, minLng: -71.0842, maxLng: -66.8854 },
  { name: 'Maryland', abbreviation: 'MD', minLat: 37.9118, maxLat: 39.7229, minLng: -79.4877, maxLng: -75.0489 },
  { name: 'Massachusetts', abbreviation: 'MA', minLat: 41.2376, maxLat: 42.8868, minLng: -73.5081, maxLng: -69.9286 },
  { name: 'Michigan', abbreviation: 'MI', minLat: 41.6960, maxLat: 48.2388, minLng: -90.4182, maxLng: -82.1221 },
  { name: 'Minnesota', abbreviation: 'MN', minLat: 43.4999, maxLat: 49.3844, minLng: -97.2394, maxLng: -89.4917 },
  { name: 'Mississippi', abbreviation: 'MS', minLat: 30.1734, maxLat: 34.9961, minLng: -91.6549, maxLng: -88.0977 },
  { name: 'Missouri', abbreviation: 'MO', minLat: 35.9957, maxLat: 40.6136, minLng: -95.7742, maxLng: -89.0988 },
  { name: 'Montana', abbreviation: 'MT', minLat: 44.3583, maxLat: 49.0011, minLng: -116.0489, maxLng: -104.0397 },
  { name: 'Nebraska', abbreviation: 'NE', minLat: 39.9999, maxLat: 43.0017, minLng: -104.0533, maxLng: -95.3080 },
  { name: 'Nevada', abbreviation: 'NV', minLat: 35.0018, maxLat: 42.0022, minLng: -120.0064, maxLng: -114.0396 },
  { name: 'New Hampshire', abbreviation: 'NH', minLat: 42.6970, maxLat: 45.3055, minLng: -72.5570, maxLng: -70.6103 },
  { name: 'New Jersey', abbreviation: 'NJ', minLat: 38.9281, maxLat: 41.3574, minLng: -75.5597, maxLng: -73.8937 },
  { name: 'New Mexico', abbreviation: 'NM', minLat: 31.3328, maxLat: 37.0002, minLng: -109.0502, maxLng: -103.0020 },
  { name: 'New York', abbreviation: 'NY', minLat: 40.4774, maxLat: 45.0158, minLng: -79.7624, maxLng: -71.7774 },
  { name: 'North Carolina', abbreviation: 'NC', minLat: 33.7514, maxLat: 36.5881, minLng: -84.3218, maxLng: -75.4001 },
  { name: 'North Dakota', abbreviation: 'ND', minLat: 45.9350, maxLat: 49.0011, minLng: -104.0489, maxLng: -96.5544 },
  { name: 'Ohio', abbreviation: 'OH', minLat: 38.4037, maxLat: 41.9773, minLng: -84.8203, maxLng: -80.5183 },
  { name: 'Oklahoma', abbreviation: 'OK', minLat: 33.6159, maxLat: 37.0020, minLng: -103.0025, maxLng: -94.4312 },
  { name: 'Oregon', abbreviation: 'OR', minLat: 41.9918, maxLat: 46.2991, minLng: -124.7038, maxLng: -116.4635 },
  { name: 'Pennsylvania', abbreviation: 'PA', minLat: 39.7198, maxLat: 42.5159, minLng: -80.5190, maxLng: -74.6895 },
  { name: 'Rhode Island', abbreviation: 'RI', minLat: 41.1460, maxLat: 42.0187, minLng: -71.8620, maxLng: -71.1208 },
  { name: 'South Carolina', abbreviation: 'SC', minLat: 32.0346, maxLat: 35.2154, minLng: -83.3532, maxLng: -78.4991 },
  { name: 'South Dakota', abbreviation: 'SD', minLat: 42.4799, maxLat: 45.9454, minLng: -104.0578, maxLng: -96.4367 },
  { name: 'Tennessee', abbreviation: 'TN', minLat: 34.9829, maxLat: 36.6782, minLng: -90.3103, maxLng: -81.6469 },
  { name: 'Texas', abbreviation: 'TX', minLat: 25.8371, maxLat: 36.5007, minLng: -106.6456, maxLng: -93.5084 },
  { name: 'Utah', abbreviation: 'UT', minLat: 36.9979, maxLat: 42.0013, minLng: -114.0524, maxLng: -109.0413 },
  { name: 'Vermont', abbreviation: 'VT', minLat: 42.7269, maxLat: 45.0067, minLng: -73.4540, maxLng: -71.4653 },
  { name: 'Virginia', abbreviation: 'VA', minLat: 36.5407, maxLat: 39.4660, minLng: -83.6753, maxLng: -75.1657 },
  { name: 'Washington', abbreviation: 'WA', minLat: 45.5437, maxLat: 49.0024, minLng: -124.8489, maxLng: -116.9158 },
  { name: 'West Virginia', abbreviation: 'WV', minLat: 37.2015, maxLat: 40.6385, minLng: -82.6447, maxLng: -77.7190 },
  { name: 'Wisconsin', abbreviation: 'WI', minLat: 42.4919, maxLat: 47.3098, minLng: -92.8892, maxLng: -86.2479 },
  { name: 'Wyoming', abbreviation: 'WY', minLat: 40.9979, maxLat: 45.0018, minLng: -111.0567, maxLng: -104.0525 },
];

export function detectStateFromCoordinates(lat: number, lng: number): StateBoundary | null {
  return US_STATE_BOUNDARIES.find(state => 
    lat >= state.minLat && 
    lat <= state.maxLat && 
    lng >= state.minLng && 
    lng <= state.maxLng
  ) || null;
}

export function calculateTripStatistics(data: any[]) {
  const states = new Set<string>();
  let totalMiles = 0;
  let startDate: Date | null = null;
  let endDate: Date | null = null;
  let minOdometer = Infinity;
  let maxOdometer = 0;

  data.forEach((row) => {
    const lat = parseFloat(row['Latitude']);
    const lng = parseFloat(row['Longitude']);
    const timestamp = row['Timestamp (UTC)'];
    const odometer = parseFloat(row['Odometer (mi)'] || '0');

    if (!isNaN(lat) && !isNaN(lng)) {
      const state = detectStateFromCoordinates(lat, lng);
      if (state) {
        states.add(state.abbreviation);
      }
    }

    if (!isNaN(odometer)) {
      minOdometer = Math.min(minOdometer, odometer);
      maxOdometer = Math.max(maxOdometer, odometer);
    }

    if (timestamp) {
      const date = new Date(timestamp);
      if (!startDate || date < startDate) startDate = date;
      if (!endDate || date > endDate) endDate = date;
    }
  });

  totalMiles = maxOdometer - minOdometer;
  const daysElapsed = startDate && endDate 
    ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return {
    statesDetected: Array.from(states),
    totalRecords: data.length,
    totalMiles: Math.round(totalMiles),
    startDate: startDate?.toLocaleDateString(),
    endDate: endDate?.toLocaleDateString(),
    daysElapsed,
    averageMilesPerDay: daysElapsed > 0 ? Math.round(totalMiles / daysElapsed) : 0
  };
}