import WebSocket from "ws";
import { Server } from "http";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ActiveUser {
  userId: string;
  socket: WebSocket;
}

interface ConversationRoom {
  conversationId: string;
  activeUsers: ActiveUser[];
}

export class WsServer {
  private wss: WebSocket.Server;
  private rooms: ConversationRoom[] = [];

  constructor(server: Server) {
    this.wss = new WebSocket.Server({ server });

    this.wss.on("connection", (ws, req) => {
      const token = req.url?.split("token=")[1];

      if (!token) {
        ws.close();
        return;
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
          userId: string;
        };
        const userId = decoded.userId;

        ws.on("message", async (message) => {
          try {
            const data = JSON.parse(message.toString());

            switch (data.type) {
              case "join":
                await this.handleJoin(userId, ws, data.conversationId);
                break;

              case "message":
                await this.handleMessage(
                  userId,
                  data.conversationId,
                  data.content,
                  data.isAISuggestion,
                );
                break;

              case "typing":
                this.handleTyping(userId, data.conversationId, data.isTyping);
                break;

              case "suggestion":
                await this.handleSuggestion(
                  userId,
                  data.conversationId,
                  data.suggestion,
                );
                break;
            }
          } catch (error) {
            console.error("WebSocket message error:", error);
          }
        });

        ws.on("close", () => {
          this.handleDisconnect(userId);
        });

        ws.on("error", (error) => {
          console.error("WebSocket error:", error);
          this.handleDisconnect(userId);
        });
      } catch (error) {
        console.error("WebSocket connection error:", error);
        ws.close();
      }
    });
  }

  private async handleJoin(
    userId: string,
    ws: WebSocket,
    conversationId: string,
  ) {
    try {
      // Verify user is a member of this conversation
      const isMember = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          members: {
            some: { id: userId },
          },
        },
      });

      if (!isMember) {
        ws.close();
        return;
      }

      let room = this.rooms.find((r) => r.conversationId === conversationId);

      if (!room) {
        room = { conversationId, activeUsers: [] };
        this.rooms.push(room);
      }

      // Remove user from any other rooms
      this.rooms.forEach((r) => {
        r.activeUsers = r.activeUsers.filter((u) => u.userId !== userId);
      });

      // Add to current room
      room.activeUsers.push({ userId, socket: ws });

      // Notify others in the room
      room.activeUsers.forEach((user) => {
        if (user.userId !== userId) {
          user.socket.send(
            JSON.stringify({
              type: "presence",
              userId,
              isOnline: true,
            }),
          );
        }
      });

      // Send conversation members list to the joining user
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          members: {
            select: {
              id: true,
              name: true,
              avatar: true,
              isAdmin: true,
            },
          },
        },
      });

      ws.send(
        JSON.stringify({
          type: "members",
          members: conversation?.members || [],
        }),
      );
    } catch (error) {
      console.error("Join error:", error);
    }
  }

  private async handleMessage(
    senderId: string,
    conversationId: string,
    content: string,
    isAISuggestion?: boolean,
  ) {
    try {
      // Save to database
      const message = await prisma.message.create({
        data: {
          content,
          senderId,
          conversationId,
          isAISuggestion:
            typeof isAISuggestion === "boolean" ? isAISuggestion : false,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      });

      // Update conversation's updatedAt
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      // Broadcast to room
      const room = this.rooms.find((r) => r.conversationId === conversationId);

      if (room) {
        room.activeUsers.forEach((user) => {
          if (user.socket.readyState === WebSocket.OPEN) {
            user.socket.send(
              JSON.stringify({
                type: "message",
                message,
              }),
            );
          }
        });
      }
    } catch (error) {
      console.error("Message handling error:", error);
    }
  }

  private handleTyping(
    userId: string,
    conversationId: string,
    isTyping: boolean,
  ) {
    try {
      const room = this.rooms.find((r) => r.conversationId === conversationId);

      if (room) {
        room.activeUsers.forEach((user) => {
          if (
            user.userId !== userId &&
            user.socket.readyState === WebSocket.OPEN
          ) {
            user.socket.send(
              JSON.stringify({
                type: "typing",
                userId,
                isTyping,
              }),
            );
          }
        });
      }
    } catch (error) {
      console.error("Typing indicator error:", error);
    }
  }

  private async handleSuggestion(
    userId: string,
    conversationId: string,
    suggestion: string,
  ) {
    try {
      const room = this.rooms.find((r) => r.conversationId === conversationId);

      if (room) {
        room.activeUsers.forEach((user) => {
          if (
            user.userId === userId &&
            user.socket.readyState === WebSocket.OPEN
          ) {
            user.socket.send(
              JSON.stringify({
                type: "suggestion",
                suggestion,
              }),
            );
          }
        });
      }
    } catch (error) {
      console.error("Suggestion handling error:", error);
    }
  }

  private handleDisconnect(userId: string) {
    try {
      // Remove user from all rooms and notify
      this.rooms.forEach((room) => {
        const wasInRoom = room.activeUsers.some((u) => u.userId === userId);
        room.activeUsers = room.activeUsers.filter((u) => u.userId !== userId);

        if (wasInRoom) {
          room.activeUsers.forEach((user) => {
            if (user.socket.readyState === WebSocket.OPEN) {
              user.socket.send(
                JSON.stringify({
                  type: "presence",
                  userId,
                  isOnline: false,
                }),
              );
            }
          });
        }
      });

      // Remove empty rooms
      this.rooms = this.rooms.filter((room) => room.activeUsers.length > 0);
    } catch (error) {
      console.error("Disconnect handling error:", error);
    }
  }
}
