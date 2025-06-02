/// <reference lib="webworker" />

import { Client } from 'teslajs';

const CLIENT_ID = 'a78b7df7-5e4f-4ea4-91f4-d3963bcaf74e';
const CLIENT_SECRET = 'ta-secret.t4@VFJevq!il8gTM';

export async function onRequest(context) {
  try {
    // Authenticate with Tesla API
    const client = new Client({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      // Use environment variables or secrets for username/password
      email: context.env.TESLA_EMAIL,
      password: context.env.TESLA_PASSWORD
    });

    // Fetch vehicle data
    const vehicles = await client.vehicles();
    if (!vehicles || vehicles.length === 0) {
      return new Response(JSON.stringify({}), { status: 404 });
    }

    const vehicle = vehicles[0];
    const vehicleData = await client.vehicle(vehicle.id_s);

    // Extract telemetry
    const current = vehicleData.drive_state?.nearest_charging_site || 'Unknown';
    const next = vehicleData.drive_state?.next_charging_site || 'Unknown';
    const eta = new Date().toISOString(); // Placeholder
    const currentLat = vehicleData.drive_state?.latitude || 0;
    const currentLng = vehicleData.drive_state?.longitude || 0;

    const response = {
      current,
      next,
      eta,
      currentLat,
      currentLng
    };

    return new Response(JSON.stringify(response), {
      headers: { 'content-type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
