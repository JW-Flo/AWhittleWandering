export class AgentMessagingDurableObject {
  private state: any;
  private env: any;
  private clients: Set<WebSocket>;

  constructor(state: any, env: any) {
    this.state = state;
    this.env = env;
    this.clients = new Set();
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected websocket', { status: 400 });
    }

    const [client, server] = Object.values(new WebSocketPair()) as [WebSocket, WebSocket];
    this.handleSession(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  private handleSession(webSocket: WebSocket): void {
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
