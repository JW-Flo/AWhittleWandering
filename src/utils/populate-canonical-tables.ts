import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

interface Drive {
  id: string;
  name: string;
}

interface Charge {
  id: string;
  driveId: string;
  amount: number;
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // In a real implementation, this data would be sourced from raw tables or external feeds.
    // For demonstration, we define sample data.
    const drives: Drive[] = [
      { id: 'drive_001', name: 'Spring Promotion' },
      { id: 'drive_002', name: 'Summer Clearance' },
    ];

    const charges: Charge[] = [
      { id: 'charge_001', driveId: 'drive_001', amount: 250.00 },
      { id: 'charge_002', driveId: 'drive_001', amount: 75.50 },
      { id: 'charge_003', driveId: 'drive_002', amount: 120.00 },
    ];

    for (const drive of drives) {
      await client.query(
        `INSERT INTO drives (id, name) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
        [drive.id, drive.name]
      );
    }

    for (const charge of charges) {
      await client.query(
        `INSERT INTO charges (id, drive_id, amount) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET drive_id = EXCLUDED.drive_id, amount = EXCLUDED.amount`,
        [charge.id, charge.driveId, charge.amount]
      );
    }

    await client.query('COMMIT');
    console.log('Successfully populated canonical tables for drives and charges');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error populating canonical tables:', err);
    process.exit(1);
  } finally {
    client.release();
  }
}

main();
