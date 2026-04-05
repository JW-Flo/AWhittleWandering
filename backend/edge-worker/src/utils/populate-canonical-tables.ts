import { z } from 'zod';
import type { Env } from '../types';

/**
 * Populates canonical tables from raw Tessie data and CSV files.
 * This function is intended to run in a Node.js environment (e.g., wrangler dev
 * or a migration script) where streams and the csv-parser package are available.
 * It uses a D1 transaction to ensure atomic inserts.
 */
export async function populateCanonicalTables(env: Env): Promise<void> {
  const db = env.DB;
  // Start a transaction
  await db.prepare('BEGIN').run();

  try {
    // ---------- Tessie Data ----------
    const tessieRaw = env.TESSIE_RAW ?? '';
    if (!tessieRaw) {
      throw new Error('Environment variable TESSIE_RAW is missing or empty');
    }
    let tessieData: unknown;
    try {
      tessieData = JSON.parse(tessieRaw);
    } catch (e) {
      throw new Error('Failed to parse TESSIE_RAW as JSON: ' + (e as Error).message);
    }

    // Define expected Tessie schema (adjust fields as needed)
    const TessieSchema = z.object({
      vin: z.string(),
      timestamp: z.number().int(),
      speed: z.number().nonnegative().optional(),
      // Add other fields as required by your canonical table
    });
    const TessieArraySchema = z.array(TessieSchema);
    const tessieValid = TessieArraySchema.parse(tessieData);

    // Insert each Tessie record into canonical_tessie
    for (const row of tessieValid) {
      await db.prepare(
        `INSERT INTO canonical_tessie (vin, timestamp, speed) 
         VALUES (?, ?, ?)`
      )
        .bind(row.vin, row.timestamp, row.speed ?? null)
        .run();
    }

    // ---------- CSV Files ----------
    // Assume CSV files are stored in a KV namespace bound as CSV_ASSETS
    const csvKV = env.CSV_ASSETS;
    if (!csvKV) {
      throw new Error('Environment binding CSV_ASSETS (KV namespace) is not defined');
    }

    const { keys } = await csvKV.list();
    for (const { name } of keys) {
      const csvText = await csvKV.get(name);
      if (csvText === null) {
        continue; // skip missing
      }

      // Use csv-parser to transform CSV text into JSON objects
      // Note: This relies on Node.js streams; ensure this runs in a Node environment.
      const { pipeline } = await import('stream');
      const { promisify } = await import('util');
      const pipelineAsync = promisify(pipeline);

      const csvParser = await import('csv-parser');
      const results: any[] = [];

      const readable = await import('stream');
      const readStream = new readable.Readable();
      readStream.push(csvText);
      readStream.push(null);

      await pipelineAsync(
        readStream,
        csvParser.default(),
        new writable.Writable({
          write(chunk, _, cb) {
            results.push(chunk);
            cb();
          },
        })
      );

      // Validate CSV rows against a schema (adjust as needed)
      const CsvRowSchema = z.object({
        // Example columns – replace with actual CSV headers
        date: z.string().datetime(),
        value: z.number(),
        // Add other columns as needed
      });
      const CsvArraySchema = z.array(CsvRowSchema);
      const csvValid = CsvArraySchema.parse(results);

      // Insert each CSV row into canonical_csv
      for (const row of csvValid) {
        await db.prepare(
          `INSERT INTO canonical_csv (date, value) 
           VALUES (?, ?)`
        )
          .bind(row.date, row.value)
          .run();
      }
    }

    // Commit transaction
    await db.prepare('COMMIT').run();
  } catch (err) {
    // Rollback on any error
    await db.prepare('ROLLBACK').run();
    console.error('Error populating canonical tables:', err);
    throw err;
  }
}

// If this file is executed directly (e.g., via `node`), run the population.
if (import.meta.url === `file://${process.argv[1]}`) {
  // In a direct execution scenario, we expect a minimal Env mock.
  // This is mainly for testing; in production, wrangler provides the real Env.
  const mockEnv: Env = {
    // @ts-expect-error – properties are filled in by the runtime
    DB: process.env.DB as any,
    TESSIE_RAW: process.env.TESSIE_RAW,
    CSV_ASSETS: process.env.CSV_ASSETS as any,
  };
  populateCanonicalTables(mockEnv).catch((e) => {
    console.error('Failed to populate tables:', e);
    process.exit(1);
  });
}
