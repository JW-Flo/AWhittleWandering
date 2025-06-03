import { AgentMessagingDurableObject } from './agentMessagingDurableObject';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/agent-messaging')) {
      const id = env.AGENT_MESSAGING_DO.idFromName('agent-messaging');
      const obj = env.AGENT_MESSAGING_DO.get(id);
      return obj.fetch(request);
    }
    // Handle other routes or return 404
    return new Response('Not Found', { status: 404 });
  }
};
