import { Pool } from 'pg';
import axios from 'axios';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fetchTessieData() {
  const response = await axios.get('https://api.tessie.com/1/vehicles', {
    headers: { Authorization: `Bearer ${process.env.TESSIE_API_KEY}` },
  });
  return response.data;
}

async function insertVehicle(vehicle: any) {
  const query = `
    INSERT INTO canonical_vehicles (id, vin, make, model, year, color, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      vin = EXCLUDED.vin,
      make = EXCLUDED.make,
      model = EXCLUDED.model,
      year = EXCLUDED.year,
      color = EXCLUDED.color,
      updated_at = NOW();
  `;
  const values = [
    vehicle.id,
    vehicle.vin,
    vehicle.make ?? 'Tesla',
    vehicle.model,
    vehicle.year,
    vehicle.color ?? null,
  ];
  await pool.query(query, values);
}

async function insertVehicleState(vehicleId: string, state: string) {
  const query = `
    INSERT INTO canonical_vehicle_states (vehicle_id, state, timestamp, created_at)
    VALUES ($1, $2, $3, NOW())
  `;
  await pool.query(query, [vehicleId, state, new Date()]);
}

async function populateCanonicalTables() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const tessieData = await fetchTessieData();
    for (const vehicle of tessieData) {
      await insertVehicle(vehicle);
      if (vehicle.state) {
        await insertVehicleState(vehicle.id, vehicle.state);
      }
    }
    await client.query('COMMIT');
    console.log('Canonical tables populated successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error populating canonical tables:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  populateCanonicalTables().catch(console.error);
}

export default populateCanonicalTables;
