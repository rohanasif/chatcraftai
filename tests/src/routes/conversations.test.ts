import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import conversationsRouter from "@backend/routes/conversations";
import authRouter from "@backend/routes/auth";
import {
  createTestUser,
  createTestConversation,
  generateToken,
  cleanupTestData,
  createAuthenticatedRequest,
} from "../utils/testUtils";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/conversations", conversationsRouter);
app.use("/api/auth", authRouter);

describe("Conversations Routes", () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe("POST /api/conversations/direct", () => {
    let user1: any;
    let user2: any;
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
      authToken = generateToken(user1.id);
    });

    it("should create a new direct chat between two users", async () => {
      const response = await request(app)
        .post("/api/conversations/direct")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          userId: user1.id,
          targetEmail: user2.email,
        })
        .expect(200);

      expect(response.body).toHaveProperty("id");
      expect(response.body.isGroup).toBe(false);
      expect(response.body.members).toHaveLength(2);
      expect(response.body.members.map((m: any) => m.id)).toContain(user1.id);
      expect(response.body.members.map((m: any) => m.id)).toContain(user2.id);
    });

    it("should return existing conversation if direct chat already exists", async () => {
      // Create first conversation
      const firstResponse = await request(app)
        .post("/api/conversations/direct")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          userId: user1.id,
          targetEmail: user2.email,
        })
        .expect(200);

      const conversationId = firstResponse.body.id;

      // Try to create same conversation again
      const secondResponse = await request(app)
        .post("/api/conversations/direct")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          userId: user1.id,
          targetEmail: user2.email,
        })
        .expect(200);

      expect(secondResponse.body.id).toBe(conversationId);
    });

    it("should handle errors gracefully", async () => {
      const response = await request(app)
        .post("/api/conversations/direct")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          userId: user1.id,
          targetEmail: "non-existent@example.com",
        })
        .expect(404);

      expect(response.body.error).toBe(
        "User not found with that email address"
      );
    });
  });

  describe("POST /api/conversations/group", () => {
    let user1: any;
    let user2: any;
    let user3: any;
    let authToken: string;

    beforeEach(async () => {
      user1 = await createTestUser({
        email: "user1@example.com",
        name: "User 1",
        isAdmin: true,
      });
      user2 = await createTestUser({
        email: "user2@example.com",
        name: "User 2",
      });
      user3 = await createTestUser({
        email: "user3@example.com",
        name: "User 3",
      });
      authToken = generateToken(user1.id);
    });

    it("should create a new group chat", async () => {
      const response = await request(app)
        .post("/api/conversations/group")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "Test Group",
          memberEmails: [user1.email, user2.email, user3.email],
          isPublic: true,
        })
        .expect(200);

      expect(response.body).toHaveProperty("id");
      expect(response.body.title).toBe("Test Group");
      expect(response.body.isGroup).toBe(true);
      expect(response.body.isPublic).toBe(true);
      expect(response.body.members).toHaveLength(3);
    });

    it("should create a private group chat", async () => {
      const response = await request(app)
        .post("/api/conversations/group")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "Private Group",
          memberEmails: [user1.email, user2.email],
          isPublic: false,
        })
        .expect(200);

      expect(response.body.isPublic).toBe(false);
    });

    it("should handle errors gracefully", async () => {
      const response = await request(app)
        .post("/api/conversations/group")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "Test Group",
          memberEmails: ["non-existent@example.com"],
        })
        .expect(404);

      expect(response.body.error).toBe(
        "Users not found: non-existent@example.com"
      );
    });
  });

  describe("GET /api/conversations/discover/:userId", () => {
    let user1: any;
    let user2: any;
    let publicGroup: any;
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
      authToken = generateToken(user1.id);

      // Create a public group that user1 is not a member of
      publicGroup = await createTestConversation(
        {
          title: "Public Group",
          isGroup: true,
          isPublic: true,
        },
        [user2]
      ); // Only user2 is a member
    });

    it("should return public groups user is not a member of", async () => {
      const response = await request(app)
        .get(`/api/conversations/discover/${user1.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].id).toBe(publicGroup.id);
      expect(response.body[0].title).toBe("Public Group");
      expect(response.body[0].isPublic).toBe(true);
    });

    it("should not return groups user is already a member of", async () => {
      const response = await request(app)
        .get(`/api/conversations/discover/${user2.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.length).toBe(0);
    });

    it("should handle errors gracefully", async () => {
      const response = await request(app)
        .get("/api/conversations/discover/invalid-user-id")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toBe("User not found");
    });
  });

  describe("POST /api/conversations/:groupId/join", () => {
    let user1: any;
    let user2: any;
    let publicGroup: any;
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
      authToken = generateToken(user1.id);

      // Create a public group
      publicGroup = await createTestConversation(
        {
          title: "Public Group",
          isGroup: true,
          isPublic: true,
        },
        [user2]
      ); // Only user2 is a member initially
    });

    it("should allow user to join public group", async () => {
      const response = await request(app)
        .post(`/api/conversations/${publicGroup.id}/join`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ userId: user1.id })
        .expect(200);

      expect(response.body.members).toHaveLength(2);
      expect(response.body.members.map((m: any) => m.id)).toContain(user1.id);
      expect(response.body.members.map((m: any) => m.id)).toContain(user2.id);
    });

    it("should return 404 for non-existent group", async () => {
      const response = await request(app)
        .post("/api/conversations/non-existent-group-id/join")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ userId: user1.id })
        .expect(404);

      expect(response.body.error).toBe("Group not found or not joinable");
    });

    it("should return 404 for private group", async () => {
      // Create a private group
      const privateGroup = await createTestConversation(
        {
          title: "Private Group",
          isGroup: true,
          isPublic: false,
        },
        [user2]
      );

      const response = await request(app)
        .post(`/api/conversations/${privateGroup.id}/join`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ userId: user1.id })
        .expect(404);

      expect(response.body.error).toBe("Group not found or not joinable");
    });

    it("should return 400 if user is already a member", async () => {
      const response = await request(app)
        .post(`/api/conversations/${publicGroup.id}/join`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ userId: user2.id })
        .expect(400);

      expect(response.body.error).toBe("Already a member of this group");
    });

    it("should handle errors gracefully", async () => {
      const response = await request(app)
        .post(`/api/conversations/${publicGroup.id}/join`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ userId: "invalid-user-id" })
        .expect(500);

      expect(response.body.error).toBe(
        "An unexpected error occurred while joining group."
      );
    });
  });

  describe("GET /api/conversations/:userId", () => {
    let user1: any;
    let user2: any;
    let directChat: any;
    let groupChat: any;
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
      authToken = generateToken(user1.id);

      // Create direct chat
      directChat = await createTestConversation(
        {
          isGroup: false,
        },
        [user1, user2]
      );

      // Create group chat
      groupChat = await createTestConversation(
        {
          title: "Test Group",
          isGroup: true,
          isPublic: true,
        },
        [user1, user2]
      );
    });

    it("should return all conversations for user", async () => {
      const response = await request(app)
        .get(`/api/conversations/${user1.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);

      // Should include both direct and group conversations
      const conversationIds = response.body.map((c: any) => c.id);
      expect(conversationIds).toContain(directChat.id);
      expect(conversationIds).toContain(groupChat.id);
    });

    it("should include conversation details", async () => {
      const response = await request(app)
        .get(`/api/conversations/${user1.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      const conversation = response.body[0];
      expect(conversation).toHaveProperty("id");
      expect(conversation).toHaveProperty("title");
      expect(conversation).toHaveProperty("isGroup");
      expect(conversation).toHaveProperty("members");
      expect(conversation).toHaveProperty("messages");
    });

    it("should handle errors gracefully", async () => {
      const response = await request(app)
        .get("/api/conversations/invalid-user-id")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(500);

      expect(response.body.error).toBe("Failed to fetch conversations");
    });
  });

  describe("GET /api/conversations/:userId/unread", () => {
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
      authToken = generateToken(user1.id);

      conversation = await createTestConversation({}, [user1, user2]);
    });

    it("should return unread count for user", async () => {
      const response = await request(app)
        .get(`/api/conversations/${user1.id}/unread`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("unreadCount");
      expect(typeof response.body.unreadCount).toBe("number");
    });

    it("should handle errors gracefully", async () => {
      const response = await request(app)
        .get("/api/conversations/invalid-user-id/unread")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(500);

      expect(response.body.error).toBe("Failed to get unread count");
    });
  });

  describe("POST /api/conversations/:conversationId/read", () => {
    let user1: any;
    let conversation: any;
    let authToken: string;

    beforeEach(async () => {
      user1 = await createTestUser({
        email: "user1@example.com",
        name: "User 1",
      });
      conversation = await createTestConversation({}, [user1]);
      authToken = generateToken(user1.id);
    });

    it("should mark conversation as read for user", async () => {
      const response = await request(app)
        .post(`/api/conversations/${conversation.id}/read`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.markedAsRead).toBeGreaterThanOrEqual(0);
    });

    it("should handle errors gracefully", async () => {
      const response = await request(app)
        .post("/api/conversations/invalid-conversation-id/read")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(500);

      expect(response.body.error).toBe("Failed to mark as read");
    });
  });

  describe("Admin Conversation Routes", () => {
    let adminToken: string;
    let userToken: string;
    let adminUser: any;
    let regularUser: any;
    let testGroup: any;

    beforeEach(async () => {
      // Create admin user
      const adminResponse = await request(app).post("/api/auth/register").send({
        email: "admin@test.com",
        password: "admin123",
        name: "Admin User",
        isAdmin: true,
      });
      adminUser = adminResponse.body.user;
      adminToken = adminResponse.headers["set-cookie"]?.[0] || "";

      // Create regular user
      const userResponse = await request(app).post("/api/auth/register").send({
        email: "user@test.com",
        password: "user123",
        name: "Regular User",
        isAdmin: false,
      });
      regularUser = userResponse.body.user;
      userToken = userResponse.headers["set-cookie"]?.[0] || "";

      // Create a test group
      const groupResponse = await request(app)
        .post("/api/conversations/group")
        .set("Cookie", adminToken)
        .send({
          title: "Test Group",
          memberEmails: [regularUser.email],
          isPublic: true,
        });
      testGroup = groupResponse.body;
    });

    describe("GET /conversations/admin/groups", () => {
      it("should allow admin to get all groups", async () => {
        const response = await request(app)
          .get("/api/conversations/admin/groups")
          .set("Cookie", adminToken);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
      });

      it("should deny regular user access to admin groups endpoint", async () => {
        const response = await request(app)
          .get("/api/conversations/admin/groups")
          .set("Cookie", userToken);

        expect(response.status).toBe(403);
        expect(response.body.error).toBe("Admin access required");
      });

      it("should deny unauthenticated access", async () => {
        const response = await request(app).get(
          "/api/conversations/admin/groups"
        );

        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Access token required");
      });
    });

    describe("PUT /conversations/admin/groups/:groupId", () => {
      it("should allow admin to update group title", async () => {
        const response = await request(app)
          .put(`/api/conversations/admin/groups/${testGroup.id}`)
          .set("Cookie", adminToken)
          .send({ title: "Updated Group Title" });

        expect(response.status).toBe(200);
        expect(response.body.title).toBe("Updated Group Title");
      });

      it("should allow admin to update group public status", async () => {
        const response = await request(app)
          .put(`/api/conversations/admin/groups/${testGroup.id}`)
          .set("Cookie", adminToken)
          .send({ isPublic: false });

        expect(response.status).toBe(200);
        expect(response.body.isPublic).toBe(false);
      });

      it("should deny regular user access to update group", async () => {
        const response = await request(app)
          .put(`/api/conversations/admin/groups/${testGroup.id}`)
          .set("Cookie", userToken)
          .send({ title: "Unauthorized Update" });

        expect(response.status).toBe(403);
        expect(response.body.error).toBe("Admin access required");
      });

      it("should return 404 for non-existent group", async () => {
        const response = await request(app)
          .put("/api/conversations/admin/groups/non-existent-id")
          .set("Cookie", adminToken)
          .send({ title: "Test" });

        expect(response.status).toBe(404);
        expect(response.body.error).toBe("Group not found");
      });
    });

    describe("DELETE /conversations/admin/groups/:groupId", () => {
      it("should allow admin to delete group", async () => {
        // Create a group to delete
        const groupToDelete = await request(app)
          .post("/api/conversations/group")
          .set("Cookie", adminToken)
          .send({
            title: "Group to Delete",
            memberEmails: [regularUser.email],
            isPublic: true,
          });

        const response = await request(app)
          .delete(`/api/conversations/admin/groups/${groupToDelete.body.id}`)
          .set("Cookie", adminToken);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it("should deny regular user access to delete group", async () => {
        const response = await request(app)
          .delete(`/api/conversations/admin/groups/${testGroup.id}`)
          .set("Cookie", userToken);

        expect(response.status).toBe(403);
        expect(response.body.error).toBe("Admin access required");
      });

      it("should return 404 for non-existent group", async () => {
        const response = await request(app)
          .delete("/api/conversations/admin/groups/non-existent-id")
          .set("Cookie", adminToken);

        expect(response.status).toBe(404);
        expect(response.body.error).toBe("Group not found");
      });
    });

    describe("POST /conversations/group (Admin Only)", () => {
      it("should allow admin to create group", async () => {
        const response = await request(app)
          .post("/api/conversations/group")
          .set("Cookie", adminToken)
          .send({
            title: "New Admin Group",
            memberEmails: [regularUser.email],
            isPublic: false,
          });

        expect(response.status).toBe(200);
        expect(response.body.title).toBe("New Admin Group");
        expect(response.body.isGroup).toBe(true);
        expect(response.body.creator.id).toBe(adminUser.id);
      });

      it("should deny regular user access to create group", async () => {
        const response = await request(app)
          .post("/api/conversations/group")
          .set("Cookie", userToken)
          .send({
            title: "Unauthorized Group",
            memberEmails: [adminUser.email],
            isPublic: true,
          });

        expect(response.status).toBe(403);
        expect(response.body.error).toBe("Admin access required");
      });

      it("should validate required fields", async () => {
        const response = await request(app)
          .post("/api/conversations/group")
          .set("Cookie", adminToken)
          .send({
            title: "Invalid Group",
            // Missing memberEmails
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe(
          "title and memberEmails[] are required"
        );
      });
    });
  });
});
