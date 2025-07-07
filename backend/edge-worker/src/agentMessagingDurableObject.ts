import { DurableObjectState, WebSocket, WebSocketPair } from '@cloudflare/workers-types';

export class AgentMessagingDurableObject {
  private state: DurableObjectState;
  private env: Record<string, unknown>;
  private clients: Set<WebSocket>;

  constructor(state: DurableObjectState, env: Record<string, unknown>) {
    this.state = state;
    this.env = env;
    this.clients = new Set();
  }

  async fetch(request: Request) {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected websocket', { status: 400 });
    }

    const pair = new WebSocketPair();
    const { 0: client, 1: server } = pair;
    this.handleSession(server);
    const response = new Response(null, { status: 101 });
    // @ts-ignore: webSocket is a non-standard property for Cloudflare Workers
    (response as any).webSocket = client;
    return response;

  private handleSession(webSocket: WebSocket) {
    webSocket.accept();
    this.clients.add(webSocket);

    webSocket.addEventListener('message', (event) => {
      // Broadcast to all other clients
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
