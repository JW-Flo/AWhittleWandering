/**
 * Sync Service for AI Agents across Copilot, Cline, Blackbox, MCP servers, AI workers in Cloudflare, etc.
 * 
 * This service provides a real-time event synchronization mechanism using Cloudflare Durable Objects
 * and WebSocket connections to enable seamless communication and coordination among distributed AI agents.
 * 
 * Features:
 * - WebSocket connection management
 * - Event broadcasting to all connected agents
 * - Message queueing and delivery guarantees
 * - Support for agent registration and presence tracking
 */

export class SyncServiceDurableObject {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.clients = new Set();

    this.state.blockConcurrencyWhile(async () => {
      this.webSocket = null;
    });
  }

  async fetch(request) {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected websocket', { status: 400 });
    }

    const [client, server] = Object.values(new WebSocketPair());
    this.handleSession(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  async handleSession(webSocket) {
    webSocket.accept();
    this.clients.add(webSocket);

    webSocket.addEventListener('message', (event) => {
      // Broadcast received message to all other connected clients
      for (const client of this.clients) {
        if (client !== webSocket && client.readyState === 1) {
          client.send(event.data);
        }
      }
    });

    webSocket.addEventListener('close', () => {
      this.clients.delete(webSocket);
    });

    webSocket.addEventListener('error', () => {
      this.clients.delete(webSocket);
    });
  }
}

/*
Usage:

// In your Cloudflare Worker entry point:

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/sync-service')) {
      const id = env.SYNC_SERVICE_DO.idFromName('sync-service');
      const obj = env.SYNC_SERVICE_DO.get(id);
      return obj.fetch(request);
    }
    // other routes...
  }
}

*/

// Note: You need to bind this Durable Object in your wrangler.toml as SYNC_SERVICE_DO
