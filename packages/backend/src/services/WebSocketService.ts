import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import type { WSMessage } from '@ai-rpg/shared';

export class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  initialize(server: Server): void {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws: WebSocket) => {
      this.clients.add(ws);
      console.log(`[WebSocket] Client connected. Total clients: ${this.clients.size}`);

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(`[WebSocket] Client disconnected. Total clients: ${this.clients.size}`);
      });

      ws.on('error', (error) => {
        console.error('[WebSocket] Client error:', error.message);
        this.clients.delete(ws);
      });

      ws.send(JSON.stringify({
        type: 'connected',
        payload: { message: 'Connected to AI-RPG WebSocket server' },
        timestamp: Date.now(),
      }));
    });

    console.log('[WebSocket] Server initialized');
  }

  broadcast(message: WSMessage): void {
    const data = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  broadcastLLMRequest(payload: WSMessage['payload']): void {
    this.broadcast({
      type: 'llm_request',
      payload,
      timestamp: Date.now(),
    });
  }

  broadcastLLMUpdate(payload: WSMessage['payload']): void {
    this.broadcast({
      type: 'llm_update',
      payload,
      timestamp: Date.now(),
    });
  }

  broadcastAgentMessage(payload: WSMessage['payload']): void {
    this.broadcast({
      type: 'agent_message',
      payload,
      timestamp: Date.now(),
    });
  }

  broadcastLog(payload: WSMessage['payload']): void {
    this.broadcast({
      type: 'log',
      payload,
      timestamp: Date.now(),
    });
  }

  getClientCount(): number {
    return this.clients.size;
  }

  close(): void {
    if (this.wss) {
      this.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.close();
        }
      });
      this.clients.clear();
      this.wss.close();
      console.log('[WebSocket] Server closed');
    }
  }
}

let webSocketService: WebSocketService | null = null;

export function getWebSocketService(): WebSocketService {
  if (!webSocketService) {
    webSocketService = new WebSocketService();
  }
  return webSocketService;
}
