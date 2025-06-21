import { WebSocketMessage } from "../types";

type MessageHandler = (message: WebSocketMessage) => void;
type ConnectionHandler = () => void;
type ErrorHandler = (error: Event) => void;

export class WebSocketService {
  private ws: WebSocket | null = null;
  private messageHandlers: MessageHandler[] = [];
  private connectionHandlers: ConnectionHandler[] = [];
  private errorHandlers: ErrorHandler[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(token: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
    this.ws = new WebSocket(`${wsUrl}?token=${token}`);

    this.ws.onopen = () => {
      console.log("WebSocket connected");
      this.reconnectAttempts = 0;
      this.connectionHandlers.forEach((handler) => handler());
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.messageHandlers.forEach((handler) => handler(message));
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    this.ws.onclose = () => {
      console.log("WebSocket disconnected");
      this.attemptReconnect(token);
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      this.errorHandlers.forEach((handler) => handler(error));
    };
  }

  private attemptReconnect(token: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      console.log(
        `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
      );
      this.connect(token);
    }, delay);
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error("WebSocket is not connected");
    }
  }

  joinConversation(conversationId: string): void {
    this.send({
      type: "join",
      conversationId,
    });
  }

  sendMessage(conversationId: string, content: string): void {
    this.send({
      type: "message",
      conversationId,
      content,
    });
  }

  sendTyping(conversationId: string, isTyping: boolean): void {
    this.send({
      type: "typing",
      conversationId,
      isTyping,
    });
  }

  requestSuggestion(conversationId: string, suggestion: string): void {
    this.send({
      type: "suggestion",
      conversationId,
      suggestion,
    });
  }

  onMessage(handler: MessageHandler): void {
    this.messageHandlers.push(handler);
  }

  onConnect(handler: ConnectionHandler): void {
    this.connectionHandlers.push(handler);
  }

  onError(handler: ErrorHandler): void {
    this.errorHandlers.push(handler);
  }

  removeMessageHandler(handler: MessageHandler): void {
    this.messageHandlers = this.messageHandlers.filter((h) => h !== handler);
  }

  removeConnectionHandler(handler: ConnectionHandler): void {
    this.connectionHandlers = this.connectionHandlers.filter(
      (h) => h !== handler,
    );
  }

  removeErrorHandler(handler: ErrorHandler): void {
    this.errorHandlers = this.errorHandlers.filter((h) => h !== handler);
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const wsService = new WebSocketService();
