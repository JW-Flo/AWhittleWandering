import { CronDataController } from '../cron-controller';

export function buildJobs(env: any) {
  const tessieKey = env.TESSIE_API_KEY || '';
  const vin = env.TESLA_VIN || '';
  const controller = new CronDataController(env.TESLA_DB, tessieKey, vin);
  return {
    quick_state_update: async () => { await controller.quickStateUpdate(); },
    full_sync: async () => { await controller.fullDataSync(); },
    historical_backfill: async () => { await controller.historicalBackfill(); },
    data_quality_check: async () => { await controller.dataQualityCheck(); },
    ai_data_processing: async () => { await controller.aiDataProcessing(); }
  } as const;
}
