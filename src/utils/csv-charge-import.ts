import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ChargeCSVRow {
  name: string;
  amount: number;
  code?: string;
  description?: string;
}

/**
 * Reads a CSV file containing charge data and upserts records into the charges table.
 * Expects columns: name, amount, code (optional), description (optional).
 * The 'code' column is used as the unique identifier for upsert; if missing,
 * the combination of name and amount is used as a fallback unique key.
 *
 * @param filePath - Absolute or relative path to the CSV file.
 */
export async function importChargesFromCSV(filePath: string): Promise<void> {
  try {
    const fileContent = readFileSync(filePath, { encoding: 'utf-8' });
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as ChargeCSVRow[];

    if (records.length === 0) {
      console.warn(`CSV file at ${filePath} contains no data.`);
      return;
    }

    for (const row of records) {
      // Basic validation
      if (!row.name || typeof row.name !== 'string') {
        console.error(`Invalid or missing 'name' in row:`, row);
        continue;
      }
      if (typeof row.amount !== 'number' || isNaN(row.amount)) {
        console.error(`Invalid or missing 'amount' in row:`, row);
        continue;
      }

      const where = row.code
        ? { code: row.code }
        : { name_amount: { name: row.name, amount: row.amount } };

      // Ensure the unique constraint exists in Prisma schema; if using fallback,
      // you may need a composite unique index on (name, amount).
      await prisma.charge.upsert({
        where,
        update: {
          name: row.name,
          amount: row.amount,
          description: row.description ?? undefined,
        },
        create: {
          name: row.name,
          amount: row.amount,
          code: row.code ?? undefined,
          description: row.description ?? undefined,
        },
      });
    }

    console.log(`Successfully processed ${records.length} charge records from ${filePath}.`);
  } catch (error) {
    console.error('Failed to import charges from CSV:', error);
    throw error;
  }
}

// Optional: direct execution when run as a script
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length !== 1) {
    console.error('Usage: ts-node src/utils/csv-charge-import.ts <path-to-csv>');
    process.exit(1);
  }
  importChargesFromCSV(args[0]).then(() => process.exit(0)).catch(() => process.exit(1));
}
