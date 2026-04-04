import { db } from '../db/connection';
import { logger } from '../logger';

interface CountValidationConfig {
  tableName: string;
  expectedCount: number;
  tolerancePercent?: number;
}

export async function validateTableCounts(configs: CountValidationConfig[]): Promise<boolean> {
  let isValid = true;

  for (const config of configs) {
    try {
      const result = await db.one('SELECT COUNT(*) FROM ${tableName:name}', {
        tableName: config.tableName
      });

      const actualCount = parseInt(result.count, 10);
      const tolerance = config.tolerancePercent || 0;
      const minExpected = config.expectedCount * (1 - tolerance / 100);
      const maxExpected = config.expectedCount * (1 + tolerance / 100);

      if (actualCount < minExpected || actualCount > maxExpected) {
        logger.error('Count validation failed for ${config.tableName}', {
          expectedCount: config.expectedCount,
          actualCount,
          minExpected,
          maxExpected
        });
        isValid = false;
      } else {
        logger.info('Count validation passed for ${config.tableName}', {
          expectedCount: config.expectedCount,
          actualCount
        });
      }
    } catch (error) {
      logger.error('Error validating count for ${config.tableName}', error);
      isValid = false;
    }
  }

  return isValid;
}

export async function runFullETLValidation(): Promise<void> {
  const validationConfigs: CountValidationConfig[] = [
    { tableName: 'drives', expectedCount: 10000, tolerancePercent: 5 },
    { tableName: 'charges', expectedCount: 50000, tolerancePercent: 3 }
  ];

  try {
    // Run ETL script
    const { runETLProcess } = await import('../etl/etl-process');
    await runETLProcess();

    // Validate counts
    const isValid = await validateTableCounts(validationConfigs);

    if (!isValid) {
      throw new Error('ETL count validation failed');
    }

    logger.info('ETL process and validation completed successfully');
  } catch (error) {
    logger.error('ETL validation failed', error);
    process.exit(1);
  }
}

// If run directly
if (require.main === module) {
  runFullETLValidation().catch(error => {
    console.error('Unhandled error in ETL validation', error);
    process.exit(1);
  });
}
