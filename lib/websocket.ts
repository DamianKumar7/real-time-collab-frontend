// lib/websocket.ts

import { DocumentEvent, DocumentEventModel } from '@/types';

interface WebSocketHandler {
  onMessage: (event: DocumentEvent) => void;
  onConnectionChange?: (status: 'connected' | 'disconnected' | 'error') => void;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3 seconds
  private handlers: WebSocketHandler[] = [];

  connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.notifyConnectionChange('connected');
          resolve();
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.notifyConnectionChange('disconnected');
          this.attemptReconnect(url);
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.notifyConnectionChange('error');
          reject(error);
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as DocumentEvent;
            this.handlers.forEach(handler => handler.onMessage(data));
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

      } catch (error) {
        console.error('Error creating WebSocket connection:', error);
        reject(error);
      }
    });
  }

  private attemptReconnect(url: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => this.connect(url), this.reconnectDelay);
    } else {
      console.error('Max reconnection attempts reached');
      this.notifyConnectionChange('error');
    }
  }

  private notifyConnectionChange(status: 'connected' | 'disconnected' | 'error') {
    this.handlers.forEach(handler => {
      if (handler.onConnectionChange) {
        handler.onConnectionChange(status);
      }
    });
  }

  sendEvent(event: DocumentEventModel) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return;
    }

    try {
      this.ws.send(JSON.stringify(event));
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
    }
  }

  addHandler(handler: WebSocketHandler) {
    this.handlers.push(handler);
  }

  removeHandler(handler: WebSocketHandler) {
    this.handlers = this.handlers.filter(h => h !== handler);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.handlers = [];
    this.reconnectAttempts = 0;
  }
}

// Create a singleton instance
export const wsService = new WebSocketService();