import { CronDataController } from '../cron-controller';

export function buildJobs(env: any) {
  const tessieKey = env.TESSIE_API_TOKEN || env.TESSIE_API_KEY || '';
  const vin = env.TESLA_VIN || '';
  const controller = new CronDataController(env.TESLA_DB, tessieKey, vin);

  async function runAndAssertOk(promise: Promise<Response>, jobName: string) {
    const res = await promise;
    if (!res || typeof (res as any).ok !== 'boolean') return;
    if (!res.ok) {
      let bodyText = '';
      try {
        bodyText = await res.clone().text();
      } catch {
        // ignore
      }
      throw new Error(`Cron job ${jobName} failed with status ${res.status}${bodyText ? `: ${bodyText}` : ''}`);
    }
  }

  return {
    full_sync: async () => { await runAndAssertOk(controller.fullDataSync(), 'full_sync'); },
    historical_backfill: async () => { await runAndAssertOk(controller.historicalBackfill(), 'historical_backfill'); },
    data_quality_check: async () => { await runAndAssertOk(controller.dataQualityCheck(), 'data_quality_check'); },
    ai_data_processing: async () => { await runAndAssertOk(controller.aiDataProcessing(), 'ai_data_processing'); }
  } as const;
}
