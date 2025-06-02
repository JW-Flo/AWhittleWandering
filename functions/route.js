/// <reference lib="webworker" />

const TESLA_CLIENT_ID = 'a78b7df7-5e4f-4ea4-91f4-d3963bcaf74e';
const TESLA_CLIENT_SECRET = 'ta-secret.t4@VFJevq!il8gTM';

// Use environment variables for sensitive info
const TESLA_EMAIL = TESLA_EMAIL || '';
const TESLA_PASSWORD = TESLA_PASSWORD || '';

async function getTeslaAccessToken() {
  const url = 'https://owner-api.teslamotors.com/oauth/token';
  const body = {
    grant_type: 'password',
    client_id: TESLA_CLIENT_ID,
    client_secret: TESLA_CLIENT_SECRET,
    email: TESLA_EMAIL,
    password: TESLA_PASSWORD
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) throw new Error('Failed to get Tesla access token');
  const data = await res.json();
  return data.access_token;
}

async function getVehicleData(accessToken) {
  const url = 'https://owner-api.teslamotors.com/api/1/vehicles';
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) throw new Error('Failed to get Tesla vehicles');
  const data = await res.json();
  return data.response[0];
}

async function getVehicleState(accessToken, vehicleId) {
  const url = `https://owner-api.teslamotors.com/api/1/vehicles/${vehicleId}/vehicle_data`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) throw new Error('Failed to get Tesla vehicle data');
  const data = await res.json();
  return data.response;
}

export async function onRequest(context) {
  try {
    const accessToken = await getTeslaAccessToken();
    const vehicle = await getVehicleData(accessToken);
    const vehicleState = await getVehicleState(accessToken, vehicle.id_s);

    const current = vehicleState.drive_state?.nearest_charging_site || 'Unknown';
    const next = vehicleState.drive_state?.next_charging_site || 'Unknown';
    const eta = new Date().toISOString(); // Placeholder
    const currentLat = vehicleState.drive_state?.latitude || 0;
    const currentLng = vehicleState.drive_state?.longitude || 0;

    const response = { current, next, eta, currentLat, currentLng };

    return new Response(JSON.stringify(response), {
      headers: { 'content-type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
