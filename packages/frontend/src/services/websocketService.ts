import type { WSMessage, WSConnectionState } from '@ai-rpg/shared';

type MessageHandler = (message: WSMessage) => void;
type ConnectionHandler = (state: WSConnectionState) => void;

const WS_URL = `ws://localhost:6756`;
const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECT_DELAY = 1000;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private connectionHandlers: Set<ConnectionHandler> = new Set();
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose = false;
  
  private state: WSConnectionState = {
    connected: false,
    reconnecting: false,
    reconnectAttempts: 0,
  };

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.intentionalClose = false;
    
    try {
      this.ws = new WebSocket(WS_URL);
      
      this.ws.onopen = () => {
        console.log('[WebSocket] Connected');
        this.reconnectAttempts = 0;
        this.updateState({
          connected: true,
          reconnecting: false,
          reconnectAttempts: 0,
        });
      };

      this.ws.onclose = () => {
        console.log('[WebSocket] Disconnected');
        this.updateState({
          connected: false,
          reconnecting: false,
          reconnectAttempts: this.reconnectAttempts,
        });
        
        if (!this.intentionalClose) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          this.messageHandlers.forEach((handler) => handler(message));
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
        }
      };
    } catch (error) {
      console.error('[WebSocket] Failed to connect:', error);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.intentionalClose) {
      return;
    }

    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('[WebSocket] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = BASE_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts - 1);
    
    this.updateState({
      connected: false,
      reconnecting: true,
      reconnectAttempts: this.reconnectAttempts,
    });

    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  disconnect(): void {
    this.intentionalClose = true;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.updateState({
      connected: false,
      reconnecting: false,
      reconnectAttempts: 0,
    });
  }

  subscribe(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  subscribeToConnection(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    handler(this.state);
    return () => {
      this.connectionHandlers.delete(handler);
    };
  }

  private updateState(newState: Partial<WSConnectionState>): void {
    this.state = { ...this.state, ...newState };
    this.connectionHandlers.forEach((handler) => handler(this.state));
  }

  getState(): WSConnectionState {
    return { ...this.state };
  }

  send(message: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
}

export const websocketService = new WebSocketClient();
