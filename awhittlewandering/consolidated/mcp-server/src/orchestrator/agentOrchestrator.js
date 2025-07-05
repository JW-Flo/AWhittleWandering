import WebSocket, { WebSocketServer } from 'ws';
import crypto from 'crypto';

class AgentOrchestrator {
  constructor(port = 8080, secret) {
    this.wss = new WebSocketServer({ port });
    this.clients = new Set();
    this.secret = secret; // Shared secret for simple authentication

    this.wss.on('connection', (ws, req) => {
      // Simple token-based authentication via query param
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get('token');
      if (!this.authenticate(token)) {
        ws.close(1008, 'Unauthorized');
        return;
      }

      this.clients.add(ws);
      ws.on('message', (message) => {
        this.broadcast(message, ws);
      });
      ws.on('close', () => {
        this.clients.delete(ws);
      });
    });

    console.log(\`Agent Orchestrator WebSocket server running on ws://localhost:\${port}\`);
  }

  authenticate(token) {
    // Simple constant-time comparison to prevent timing attacks
    if (!token || !this.secret) return false;
    const tokenBuffer = Buffer.from(token);
    const secretBuffer = Buffer.from(this.secret);
    if (tokenBuffer.length !== secretBuffer.length) return false;
    return crypto.timingSafeEqual(tokenBuffer, secretBuffer);
  }

  broadcast(message, sender) {
    for (const client of this.clients) {
      if (client !== sender && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }
}

export default AgentOrchestrator;

/*
Usage:

// Start server
import AgentOrchestrator from './agentOrchestrator';
const secret = process.env.ORCHESTRATOR_SECRET || 'default_secret';
const orchestrator = new AgentOrchestrator(8080, secret);

// Agent client example
import WebSocket from 'ws';
const ws = new WebSocket('ws://localhost:8080?token=default_secret');
ws.on('open', () => {
  ws.send(JSON.stringify({ type: 'task', data: 'Do something' }));
});
ws.on('message', (msg) => {
  console.log('Received:', msg);
});
*/
