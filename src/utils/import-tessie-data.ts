import { readFile } from 'fs/promises';
import { populateCanonicalTables } from '../db/populate-canonical-tables';

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: ts-node src/utils/import-tessie-data.ts <path-to-tessie-json>');
    process.exit(1);
  }
  const [filePath] = args;
  try {
    const raw = await readFile(filePath, 'utf8');
    const data = JSON.parse(raw);
    await populateCanonicalTables(data);
    console.log('Import completed successfully');
  } catch (err) {
    console.error('Error importing Tessie data:', err);
    process.exit(1);
  }
}

main();
