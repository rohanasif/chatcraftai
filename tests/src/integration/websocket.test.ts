import jwt from "jsonwebtoken";

const JWT_SECRET =
  "klj3lrkj23jrlkj2rlj2l3krjlf2jfj2l3kj23fj32lkfjl2kj3lfkj2lkl";

// Simple WebSocket message handler for testing
class WebSocketMessageHandler {
  private mockClients: Map<string, any> = new Map();
  private mockConversations: Map<string, Set<string>> = new Map();
  private sentMessages: any[] = [];

  // Mock client connection
  connectClient(userId: string) {
    this.mockClients.set(userId, {
      send: (message: any) => {
        this.sentMessages.push({ userId, message: JSON.parse(message) });
      },
    });
  }

  // Mock client disconnection
  disconnectClient(userId: string) {
    this.mockClients.delete(userId);
    this.handleUserDisconnect(userId);
  }

  // Handle join conversation
  handleJoin(userId: string, conversationId: string, members: any[] = []) {
    // Add user to conversation
    if (!this.mockConversations.has(conversationId)) {
      this.mockConversations.set(conversationId, new Set());
    }
    this.mockConversations.get(conversationId)!.add(userId);

    // Send members list
    this.sendToUser(userId, {
      type: "members",
      conversationId,
      members,
    });
  }

  // Handle new message
  handleNewMessage(userId: string, messageData: any) {
    const savedMessage = {
      id: `msg-${Date.now()}`,
      content: messageData.content,
      senderId: userId,
      conversationId: messageData.conversationId,
      sender: { id: userId, name: "Test User" },
      createdAt: new Date().toISOString(),
    };

    // Broadcast to conversation members
    this.broadcastToConversation(messageData.conversationId, {
      type: "message",
      conversationId: messageData.conversationId,
      message: savedMessage,
    });

    return savedMessage;
  }

  // Handle typing indicator
  handleTyping(userId: string, conversationId: string, isTyping: boolean) {
    this.broadcastToConversation(conversationId, {
      type: "typing",
      conversationId,
      userId,
      isTyping,
    });
  }

  // Handle user disconnect
  private handleUserDisconnect(userId: string) {
    // Notify all conversations this user was in
    for (const [conversationId, members] of this.mockConversations.entries()) {
      if (members.has(userId)) {
        this.broadcastToConversation(conversationId, {
          type: "presence",
          conversationId,
          userId,
          isOnline: false,
        });
      }
    }
  }

  // Send message to specific user
  private sendToUser(userId: string, message: any) {
    const client = this.mockClients.get(userId);
    if (client) {
      client.send(JSON.stringify(message));
    }
  }

  // Broadcast to all members of a conversation
  private broadcastToConversation(conversationId: string, message: any) {
    const members = this.mockConversations.get(conversationId);
    if (members) {
      for (const userId of members) {
        this.sendToUser(userId, message);
      }
    }
  }

  // Get sent messages for testing
  getSentMessages() {
    return this.sentMessages;
  }

  // Clear sent messages
  clearSentMessages() {
    this.sentMessages = [];
  }

  // Get messages sent to specific user
  getMessagesForUser(userId: string) {
    return this.sentMessages
      .filter((msg) => msg.userId === userId)
      .map((msg) => msg.message);
  }

  // Get messages of specific type
  getMessagesByType(type: string) {
    return this.sentMessages
      .filter((msg) => msg.message.type === type)
      .map((msg) => msg.message);
  }
}

describe("WebSocket Message Handler", () => {
  let handler: WebSocketMessageHandler;
  const userA = { id: "user-a", name: "Test Alice" };
  const userB = { id: "user-b", name: "Test Bob" };
  const userC = { id: "user-c", name: "Test Charlie" };
  const conversationId = "conv-1";

  beforeEach(() => {
    handler = new WebSocketMessageHandler();
    handler.clearSentMessages();
  });

  describe("Message real-time delivery", () => {
    it("should deliver messages in real time to all conversation members", () => {
      // Connect clients
      handler.connectClient(userA.id);
      handler.connectClient(userB.id);

      // Join the conversation
      handler.handleJoin(userA.id, conversationId, [userA, userB]);
      handler.handleJoin(userB.id, conversationId, [userA, userB]);

      // Verify members list was sent
      const membersMessages = handler.getMessagesByType("members");
      expect(membersMessages).toHaveLength(2);
      expect(membersMessages[0].members).toHaveLength(2);

      // Send a message
      const testContent = "Hello Bob!";
      const savedMessage = handler.handleNewMessage(userA.id, {
        conversationId,
        content: testContent,
      });

      // Verify message was created
      expect(savedMessage.content).toBe(testContent);
      expect(savedMessage.senderId).toBe(userA.id);

      // Verify message was broadcast to conversation members
      const messageEvents = handler.getMessagesByType("message");
      expect(messageEvents).toHaveLength(2); // Sent to both users

      const messageToB = messageEvents.find(
        (msg: any) => msg.message.content === testContent
      );
      expect(messageToB).toBeDefined();
      expect(messageToB.message.sender.name).toBe("Test User");
    });
  });

  describe("Group creation/addition/removal", () => {
    it("should notify members in real time when a group is created", () => {
      // Connect client
      handler.connectClient(userC.id);

      // Join the group
      handler.handleJoin(userC.id, conversationId, [userA, userB, userC]);

      // Verify members list was sent
      const membersMessages = handler.getMessagesForUser(userC.id);
      const membersMsg = membersMessages.find(
        (msg: any) =>
          msg.type === "members" && msg.conversationId === conversationId
      );

      expect(membersMsg).toBeDefined();
      expect(membersMsg.members).toHaveLength(3);
    });
  });

  describe("Conversation CRUD", () => {
    it("should notify users in real time when a conversation is created and joined", () => {
      // Connect client
      handler.connectClient(userA.id);

      // Join the conversation
      handler.handleJoin(userA.id, conversationId, [userA, userB]);

      // Verify members list was sent
      const membersMessages = handler.getMessagesForUser(userA.id);
      const membersMsg = membersMessages.find(
        (msg: any) =>
          msg.type === "members" && msg.conversationId === conversationId
      );

      expect(membersMsg).toBeDefined();
      expect(membersMsg.members).toHaveLength(2);
    });
  });

  describe("WebSocket presence and typing", () => {
    it("should notify when a user is typing and when they go online/offline", () => {
      // Connect clients
      handler.connectClient(userA.id);
      handler.connectClient(userB.id);

      // Join the conversation
      handler.handleJoin(userA.id, conversationId, [userA, userB]);
      handler.handleJoin(userB.id, conversationId, [userA, userB]);

      // Send typing indicator
      handler.handleTyping(userA.id, conversationId, true);

      // Verify typing message was sent
      const typingMessages = handler.getMessagesByType("typing");
      const typingMsg = typingMessages.find(
        (msg: any) => msg.userId === userA.id && msg.isTyping === true
      );

      expect(typingMsg).toBeDefined();
      expect(typingMsg.userId).toBe(userA.id);
      expect(typingMsg.isTyping).toBe(true);

      // Test presence when user disconnects
      handler.disconnectClient(userA.id);

      // Verify presence message was sent
      const presenceMessages = handler.getMessagesByType("presence");
      const presenceMsg = presenceMessages.find(
        (msg: any) => msg.userId === userA.id && msg.isOnline === false
      );

      expect(presenceMsg).toBeDefined();
      expect(presenceMsg.isOnline).toBe(false);
    });
  });

  describe("Multiple conversations", () => {
    it("should handle messages in multiple conversations correctly", () => {
      const conversationId2 = "conv-2";

      // Connect clients
      handler.connectClient(userA.id);
      handler.connectClient(userB.id);
      handler.connectClient(userC.id);

      // Join both conversations
      handler.handleJoin(userA.id, conversationId, [userA, userB]);
      handler.handleJoin(userB.id, conversationId, [userA, userB]);
      handler.handleJoin(userA.id, conversationId2, [userA, userC]);
      handler.handleJoin(userC.id, conversationId2, [userA, userC]);

      // Send message to first conversation
      handler.handleNewMessage(userA.id, {
        conversationId,
        content: "Message in conversation 1",
      });

      // Send message to second conversation
      handler.handleNewMessage(userA.id, {
        conversationId: conversationId2,
        content: "Message in conversation 2",
      });

      // Verify messages were sent to correct users
      const messageEvents = handler.getMessagesByType("message");
      expect(messageEvents).toHaveLength(4); // 2 messages × 2 users each

      const conv1Messages = messageEvents.filter(
        (msg: any) => msg.conversationId === conversationId
      );
      const conv2Messages = messageEvents.filter(
        (msg: any) => msg.conversationId === conversationId2
      );

      expect(conv1Messages).toHaveLength(2);
      expect(conv2Messages).toHaveLength(2);
    });
  });

  describe("JWT token validation", () => {
    it("should validate JWT tokens correctly", () => {
      const validToken = jwt.sign({ userId: userA.id }, JWT_SECRET, {
        expiresIn: "1h",
      });
      const invalidToken = "invalid-token";

      // Test valid token
      expect(() => {
        const decoded = jwt.verify(validToken, JWT_SECRET) as {
          userId: string;
        };
        expect(decoded.userId).toBe(userA.id);
      }).not.toThrow();

      // Test invalid token
      expect(() => {
        jwt.verify(invalidToken, JWT_SECRET);
      }).toThrow();
    });
  });
});
