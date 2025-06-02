// Replace with a valid NWS zone or county ID, e.g. "TXZ213"
const zoneId = "YOUR_ZONE_ID";

// Base endpoint for zone stations
const baseUrl = `https://api.weather.gov/zones/forecast/${zoneId}/stations`;

// Optional query parameters
const params = new URLSearchParams({
  limit: 500,   // max 500; adjust as needed
  // cursor: "next-cursor-token" // uncomment to paginate
});

export async function getStations(cursor = "") {
  // Append cursor if we’re paginating
  if (cursor) params.set("cursor", cursor);

  const url = `${baseUrl}?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      "Accept": "application/geo+json",
      // Optional experimental header
      // "Feature-Flags": "obs_station_provider",
      "User-Agent": "your-app-name (you@example.com)"
    }
  });

  if (!response.ok) {
    const problem = await response.json();
    throw new Error(`${problem.title}: ${problem.detail}`);
  }

  const data = await response.json();
  processStations(data);

  // Handle pagination
  const next = data.pagination?.next;
  if (next) {
    const nextCursor = new URL(next).searchParams.get("cursor");
    await getStations(nextCursor);
  }
}

function processStations(geoJson) {
  geoJson.features.forEach(f => {
    const { stationIdentifier, name } = f.properties;
    console.log(`${stationIdentifier} – ${name}`);
  });
}

// Example usage
getStations().catch(console.error);
