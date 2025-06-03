import { SyncServiceDurableObject } from '../../shared/agent-coordination/syncService';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/sync-service')) {
      const id = env.SYNC_SERVICE_DO.idFromName('sync-service');
      const obj = env.SYNC_SERVICE_DO.get(id);
      return obj.fetch(request);
    }

    // Add other route handlers here or fallback
    return new Response('Not Found', { status: 404 });
  }
};
