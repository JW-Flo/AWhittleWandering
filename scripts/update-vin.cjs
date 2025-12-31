#!/usr/bin/env node

/**
 * Update Tesla VIN in database
 * Usage: node scripts/update-vin.js <VIN>
 */

const { execSync } = require('child_process');
const path = require('path');

const vin = process.argv[2];
if (!vin) {
  console.error('Usage: node scripts/update-vin.js <VIN>');
  console.error('Example: node scripts/update-vin.js 5YJYGDEE5LF027324');
  process.exit(1);
}

// Validate VIN format (17 characters, valid Tesla VIN)
if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
  console.error('Invalid VIN format. Must be 17 characters (no I, O, Q)');
  process.exit(1);
}

console.log(`Updating VIN to: ${vin}`);

try {
  // Change to backend directory
  process.chdir(path.join(__dirname, '..', 'backend', 'edge-worker'));

  // Use wrangler to execute D1 query
  const command = `npx wrangler d1 execute tesla-journey-tracker --local --command="UPDATE vehicles SET vin = '${vin}', updated_at = datetime('now') WHERE id = 'midnight-shadow';"`;

  console.log('Executing:', command);
  const result = execSync(command, { encoding: 'utf-8' });

  console.log('Result:', result);

  // Verify the update
  const verifyCommand = `npx wrangler d1 execute tesla-journey-tracker --local --command="SELECT id, vin, display_name FROM vehicles WHERE id = 'midnight-shadow';"`;
  const verifyResult = execSync(verifyCommand, { encoding: 'utf-8' });

  console.log('Verification:', verifyResult);
  console.log('✅ VIN updated successfully!');

} catch (error) {
  console.error('❌ Failed to update VIN:', error.message);
  process.exit(1);
}