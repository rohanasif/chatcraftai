import { WebSocketMessage } from "../types";
import { apiService } from "./api";

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
  private isConnecting = false;
  private connectionPromise: Promise<void> | null = null;
  private isLoggedOut = false;

  async connect(): Promise<void> {
    if (this.ws || this.isConnecting) {
      return;
    }

    // Reset logged out flag when attempting to connect
    this.isLoggedOut = false;

    this.isConnecting = true;
    this.connectionPromise = this._connect();
    return this.connectionPromise;
  }

  private async _connect(): Promise<void> {
    // Clear existing handlers to prevent duplicates
    this.clearHandlers();

    try {
      // Get the JWT token from the API
      const { token } = await apiService.getToken();

      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
      const fullUrl = `${wsUrl}?token=${token}`;
      this.ws = new WebSocket(fullUrl);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.connectionPromise = null;
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
        this.ws = null; // Clear the reference when closed
        this.isConnecting = false;
        this.connectionPromise = null;
        // Only attempt reconnection if not logged out
        if (!this.isLoggedOut) {
          this.attemptReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        this.isConnecting = false;
        this.connectionPromise = null;
        this.errorHandlers.forEach((handler) => handler(error));
      };
    } catch (error) {
      console.error("Failed to get token for WebSocket connection:", error);
      this.isConnecting = false;
      this.connectionPromise = null;

      // Don't throw authentication errors, just log them silently
      if (
        error instanceof Error &&
        (error.message === "Access token required" ||
          error.message === "Unauthorized" ||
          error.message === "User not found")
      ) {
        // This is expected when user is not authenticated
        return;
      }

      throw error;
    }
  }

  private async attemptReconnect(): Promise<void> {
    if (
      this.reconnectAttempts >= this.maxReconnectAttempts ||
      this.isLoggedOut
    ) {
      console.error("Max reconnection attempts reached or user logged out");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        console.error("Reconnection failed:", error);
      }
    }, delay);
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  logout(): void {
    this.isLoggedOut = true;
    this.disconnect();
    this.clearHandlers();
    this.reconnectAttempts = 0;
    this.isConnecting = false;
    this.connectionPromise = null;
  }

  resetForLogin(): void {
    this.isLoggedOut = false;
    this.reconnectAttempts = 0;
  }

  send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
    // Don't log error if WebSocket is not connected - this is expected during connection setup
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

  clearHandlers(): void {
    this.messageHandlers = [];
    this.connectionHandlers = [];
    this.errorHandlers = [];
  }
}

export const wsService = new WebSocketService();
