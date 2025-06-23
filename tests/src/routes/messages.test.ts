import request from "supertest";
import express from "express";

// Try to import the router with error handling
let messagesRouter;
try {
  messagesRouter = require("@backend/routes/messages").default;
} catch (error) {
  console.error("Failed to import messages router:", error);
  throw error;
}

import { getPrismaClient } from "../../../backend/lib/prisma";
import {
  createTestUser,
  createTestConversation,
  createTestMessage,
  generateToken,
  cleanupTestData,
  setupMocks,
  resetMocks,
} from "../utils/testUtils";

const app = express();
app.use(express.json());
app.use("/api/messages", messagesRouter);

describe("Messages Routes", () => {
  beforeEach(async () => {
    await cleanupTestData();
    setupMocks();
  });

  afterEach(() => {
    resetMocks();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  // Debug test to understand the 500 error
  it("should debug the 500 error", async () => {
    const user1 = await createTestUser({
      email: "user1@example.com",
      name: "User 1",
    });
    const user2 = await createTestUser({
      email: "user2@example.com",
      name: "User 2",
    });
    const conversation = await createTestConversation({}, [user1, user2]);
    const authToken = generateToken(user1.id);

    const response = await request(app)
      .get(`/api/messages/${conversation.id}`)
      .set("Authorization", `Bearer ${authToken}`);

    // Don't assert anything, just log for debugging
  });

  // Debug test without authentication to see if the route is reachable
  it("should debug route mounting", async () => {
    const response = await request(app).get(
      "/api/messages/test-conversation-id"
    );

    // Should get 401 (unauthorized) not 500 (server error)
    expect(response.status).toBe(401);
  });

  // Minimal test to check if Express app is working
  it("should have a working Express app", async () => {
    // Add a simple test route
    app.get("/test", (req, res) => {
      res.json({ message: "Test route working" });
    });

    const response = await request(app).get("/test");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Test route working");
  });

  describe("GET /api/messages/:conversationId", () => {
    let user1: any;
    let user2: any;
    let conversation: any;
    let message1: any;
    let message2: any;
    let authToken: string;

    beforeEach(async () => {
      user1 = await createTestUser({
        email: "user1@example.com",
        name: "User 1",
      });
      user2 = await createTestUser({
        email: "user2@example.com",
        name: "User 2",
      });
      conversation = await createTestConversation({}, [user1, user2]);

      // Create test messages
      message1 = await createTestMessage({
        content: "First message",
        senderId: user1.id,
        conversationId: conversation.id,
      });

      // Add a small delay to ensure different createdAt timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      message2 = await createTestMessage({
        content: "Second message",
        senderId: user2.id,
        conversationId: conversation.id,
      });

      // Fetch both messages from the database to get their createdAt values
      const prisma = await getPrismaClient();
      message1 = await prisma.message.findUnique({
        where: { id: message1.id },
      });
      message2 = await prisma.message.findUnique({
        where: { id: message2.id },
      });

      authToken = generateToken(user1.id);
    });

    it("should return messages for conversation", async () => {
      const response = await request(app)
        .get(`/api/messages/${conversation.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);

      // Messages should be returned oldest first
      expect(response.body[0].content).toBe("First message");
      expect(response.body[1].content).toBe("Second message");
    });

    it("should include sender information", async () => {
      const response = await request(app)
        .get(`/api/messages/${conversation.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      const message = response.body[0];
      expect(message).toHaveProperty("sender");
      expect(message.sender).toHaveProperty("id");
      expect(message.sender).toHaveProperty("name");
      expect(message.sender).toHaveProperty("avatar");
    });

    it("should include readBy information", async () => {
      const response = await request(app)
        .get(`/api/messages/${conversation.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      const message = response.body[0];
      expect(message).toHaveProperty("readBy");
      expect(Array.isArray(message.readBy)).toBe(true);
    });

    it("should respect limit parameter", async () => {
      const response = await request(app)
        .get(`/api/messages/${conversation.id}?limit=1`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.length).toBe(1);
    });

    it("should respect cursor parameter for pagination", async () => {
      const cursor = message2.createdAt.toISOString();
      const response = await request(app)
        .get(`/api/messages/${conversation.id}?cursor=${cursor}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      // Should return messages before the cursor
      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe(message1.id);
    });

    it("should return 401 without authentication", async () => {
      const response = await request(app)
        .get(`/api/messages/${conversation.id}`)
        .expect(401);

      expect(response.body.error).toBe("Access token required");
    });

    it("should handle errors gracefully", async () => {
      const response = await request(app)
        .get("/api/messages/invalid-conversation-id")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toBe("Conversation not found");
    });
  });

  describe("GET /api/messages/:conversationId/analytics", () => {
    let user1: any;
    let user2: any;
    let user3: any;
    let conversation: any;
    let authToken: string;

    beforeEach(async () => {
      user1 = await createTestUser({
        email: "user1@example.com",
        name: "User 1",
      });
      user2 = await createTestUser({
        email: "user2@example.com",
        name: "User 2",
      });
      user3 = await createTestUser({
        email: "user3@example.com",
        name: "User 3",
      });
      conversation = await createTestConversation({}, [user1, user2]);

      // Create some test messages
      await createTestMessage({
        content: "Hello world",
        senderId: user1.id,
        conversationId: conversation.id,
      });

      await createTestMessage({
        content: "How are you doing today?",
        senderId: user2.id,
        conversationId: conversation.id,
      });

      authToken = generateToken(user1.id);
    });

    it("should return conversation analytics for conversation member", async () => {
      const response = await request(app)
        .get(`/api/messages/${conversation.id}/analytics`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("summary");
      expect(response.body).toHaveProperty("stats");
      expect(response.body).toHaveProperty("sentiment");
      expect(response.body).toHaveProperty("sentimentTimeline");

      expect(response.body.stats).toHaveProperty("messageCount");
      expect(response.body.stats).toHaveProperty("wordCount");
      expect(response.body.stats).toHaveProperty("aiSuggestionsUsed");
      expect(response.body.stats).toHaveProperty("isInactive");
      expect(response.body.stats).toHaveProperty("lastActivity");
    });

    it("should deny access to non-member users", async () => {
      const nonMemberToken = generateToken(user3.id);

      const response = await request(app)
        .get(`/api/messages/${conversation.id}/analytics`)
        .set("Authorization", `Bearer ${nonMemberToken}`)
        .expect(404);

      expect(response.body.error).toBe(
        "Conversation not found or access denied"
      );
    });

    it("should calculate correct message count", async () => {
      const response = await request(app)
        .get(`/api/messages/${conversation.id}/analytics`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.stats.messageCount).toBe(2);
    });

    it("should calculate correct word count", async () => {
      const response = await request(app)
        .get(`/api/messages/${conversation.id}/analytics`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      // "Hello world" (2 words) + "How are you doing today?" (5 words) = 7 words
      expect(response.body.stats.wordCount).toBe(7);
    });

    it("should include sentimentTimeline in response", async () => {
      const response = await request(app)
        .get(`/api/messages/${conversation.id}/analytics`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body.sentimentTimeline)).toBe(true);
    });

    it("should return 401 without authentication", async () => {
      const response = await request(app)
        .get(`/api/messages/${conversation.id}/analytics`)
        .expect(401);

      expect(response.body.error).toBe("Access token required");
    });

    it("should handle errors gracefully", async () => {
      const response = await request(app)
        .get("/api/messages/invalid-conversation-id/analytics")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toBe(
        "Conversation not found or access denied"
      );
    });
  });

  describe("POST /api/messages/:messageId/read", () => {
    let user1: any;
    let user2: any;
    let conversation: any;
    let message: any;
    let authToken: string;

    beforeEach(async () => {
      user1 = await createTestUser({
        email: "user1@example.com",
        name: "User 1",
      });
      user2 = await createTestUser({
        email: "user2@example.com",
        name: "User 2",
      });
      conversation = await createTestConversation({}, [user1, user2]);

      message = await createTestMessage({
        content: "Test message",
        senderId: user2.id,
        conversationId: conversation.id,
      });

      authToken = generateToken(user1.id);
    });

    it("should mark message as read by user", async () => {
      const response = await request(app)
        .post(`/api/messages/${message.id}/read`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ userId: user1.id })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toHaveProperty("readBy");
      expect(response.body.message.readBy).toHaveLength(1);
      expect(response.body.message.readBy[0].id).toBe(user1.id);
    });

    it("should return 401 without authentication", async () => {
      const response = await request(app)
        .post(`/api/messages/${message.id}/read`)
        .send({ userId: user1.id })
        .expect(401);

      expect(response.body.error).toBe("Access token required");
    });

    it("should handle errors gracefully", async () => {
      const response = await request(app)
        .post("/api/messages/invalid-message-id/read")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ userId: user1.id })
        .expect(500);

      expect(response.body.error).toBe(
        "An unexpected error occurred while marking message as read."
      );
    });
  });

  describe("GET /api/messages/:conversationId/suggestions", () => {
    let user1: any;
    let user2: any;
    let conversation: any;
    let authToken: string;

    beforeEach(async () => {
      user1 = await createTestUser({
        email: "user1@example.com",
        name: "User 1",
      });
      user2 = await createTestUser({
        email: "user2@example.com",
        name: "User 2",
      });
      conversation = await createTestConversation({}, [user1, user2]);

      // Create some test messages for context
      await createTestMessage({
        content: "Hello, how are you?",
        senderId: user1.id,
        conversationId: conversation.id,
      });

      await createTestMessage({
        content: "I am doing well, thank you!",
        senderId: user2.id,
        conversationId: conversation.id,
      });

      authToken = generateToken(user1.id);
    });

    it("should return AI reply suggestions", async () => {
      const response = await request(app)
        .get(`/api/messages/${conversation.id}/suggestions`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("suggestions");
      expect(Array.isArray(response.body.suggestions)).toBe(true);
    });

    it("should respect limit parameter", async () => {
      const response = await request(app)
        .get(`/api/messages/${conversation.id}/suggestions?limit=3`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.suggestions.length).toBeLessThanOrEqual(3);
    });

    it("should return empty suggestions for conversation with no messages", async () => {
      const emptyConversation = await createTestConversation({}, [
        user1,
        user2,
      ]);

      const response = await request(app)
        .get(`/api/messages/${emptyConversation.id}/suggestions`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.suggestions).toHaveLength(0);
    });

    it("should return 401 without authentication", async () => {
      const response = await request(app)
        .get(`/api/messages/${conversation.id}/suggestions`)
        .expect(401);

      expect(response.body.error).toBe("Access token required");
    });

    it("should handle errors gracefully", async () => {
      const response = await request(app)
        .get("/api/messages/invalid-conversation-id/suggestions")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toBe(
        "Conversation not found or access denied"
      );
    });
  });
});
