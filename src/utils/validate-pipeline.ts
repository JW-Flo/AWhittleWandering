import { Env } from '@cloudflare/workers-types';

interface ValidationThresholds {
  drives: number;
  charges: number;
}

interface ValidationResult {
  drivesOk: boolean;
  chargesOk: boolean;
  drivesCount: number;
  chargesCount: number;
}

/**
 * Validates that the canonical drives and charges tables meet minimum thresholds.
 * @param env - Cloudflare Workers environment with DB binding.
 * @param thresholds - Target minimum counts for drives and charges.
 * @returns Promise resolving to validation result.
 */
export async function validatePipeline(
  env: Env,
  thresholds: ValidationThresholds
): Promise<ValidationResult> {
  const db = env.DB as D1Database;

  let drivesCount = 0;
  let chargesCount = 0;

  try {
    const drivesResult = await db.prepare('SELECT COUNT(*) AS count FROM drives').first();
    drivesCount = drivesResult?.count ?? 0;
  } catch (err) {
    console.error('Failed to query drives table:', err);
    drivesCount = 0;
  }

  try {
    const chargesResult = await db.prepare('SELECT COUNT(*) AS count FROM charges').first();
    chargesCount = chargesResult?.count ?? 0;
  } catch (err) {
    console.error('Failed to query charges table:', err);
    chargesCount = 0;
  }

  return {
    drivesOk: drivesCount >= thresholds.drives,
    chargesOk: chargesCount >= thresholds.charges,
    drivesCount,
    chargesCount,
  };
}
