import request from "supertest";
import express from "express";
import invitationsRouter from "@backend/routes/invitations";
import {
  createTestUser,
  createTestConversation,
  generateToken,
  cleanupTestData,
  setupMocks,
  resetMocks,
} from "../utils/testUtils";

const app = express();
app.use(express.json());
app.use("/api/invitations", invitationsRouter);

describe("Invitations Routes", () => {
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

  describe("POST /api/invitations/send", () => {
    let adminUser: any;
    let group: any;
    let authToken: string;

    beforeEach(async () => {
      adminUser = await createTestUser({
        email: "admin@example.com",
        name: "Admin User",
        isAdmin: true,
      });

      // Create a group with admin as creator
      group = await createTestConversation(
        {
          title: "Test Group",
          isGroup: true,
          isPublic: false,
          creatorId: adminUser.id,
        },
        [adminUser]
      );

      authToken = generateToken(adminUser.id);
    });

    it("should send group invitations successfully", async () => {
      const inviteeEmails = ["user1@example.com", "user2@example.com"];

      const response = await request(app)
        .post("/api/invitations/send")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          groupId: group.id,
          inviteeEmails,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Invitations sent successfully");
    });

    it("should return 403 if user is not group creator", async () => {
      const nonCreatorUser = await createTestUser({
        email: "noncreator@example.com",
        name: "Non Creator",
      });
      const nonCreatorToken = generateToken(nonCreatorUser.id);

      const response = await request(app)
        .post("/api/invitations/send")
        .set("Authorization", `Bearer ${nonCreatorToken}`)
        .send({
          groupId: group.id,
          inviteeEmails: ["user@example.com"],
        })
        .expect(403);

      expect(response.body.error).toBe(
        "Only group creators can send invitations"
      );
    });

    it("should return 401 without authentication", async () => {
      const response = await request(app)
        .post("/api/invitations/send")
        .send({
          groupId: group.id,
          inviteeEmails: ["user@example.com"],
        })
        .expect(401);

      expect(response.body.error).toBe("Access token required");
    });

    it("should handle errors gracefully", async () => {
      const response = await request(app)
        .post("/api/invitations/send")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          groupId: "invalid-group-id",
          inviteeEmails: ["user@example.com"],
        })
        .expect(403);

      expect(response.body.error).toBe(
        "Only group creators can send invitations"
      );
    });
  });

  describe("GET /api/invitations/:token/validate", () => {
    let group: any;
    let validToken: string;

    beforeEach(async () => {
      const adminUser = await createTestUser({
        email: "admin@example.com",
        name: "Admin User",
        isAdmin: true,
      });

      group = await createTestConversation(
        {
          title: "Test Group",
          isGroup: true,
          isPublic: false,
          creatorId: adminUser.id,
        },
        [adminUser]
      );

      // Create a valid token
      const tokenData = `${group.id}:user@example.com:${Date.now()}`;
      validToken = Buffer.from(tokenData).toString("base64");
    });

    it("should validate valid invitation token", async () => {
      const response = await request(app)
        .get(`/api/invitations/${validToken}/validate`)
        .expect(200);

      expect(response.body.valid).toBe(true);
      expect(response.body.group).toHaveProperty("id", group.id);
      expect(response.body.group).toHaveProperty("title", "Test Group");
      expect(response.body.email).toBe("user@example.com");
    });

    it("should return 400 for invalid token", async () => {
      const response = await request(app)
        .get("/api/invitations/invalid-token/validate")
        .expect(400);

      expect(response.body.error).toBe("Invalid or expired invitation");
    });

    it("should handle errors gracefully", async () => {
      const response = await request(app)
        .get("/api/invitations/malformed-token/validate")
        .expect(400);

      expect(response.body.error).toBe("Invalid or expired invitation");
    });
  });

  describe("POST /api/invitations/:token/accept", () => {
    let group: any;
    let user: any;
    let validToken: string;

    beforeEach(async () => {
      const adminUser = await createTestUser({
        email: "admin@example.com",
        name: "Admin User",
        isAdmin: true,
      });

      user = await createTestUser({
        email: "user@example.com",
        name: "Test User",
      });

      group = await createTestConversation(
        {
          title: "Test Group",
          isGroup: true,
          isPublic: false,
          creatorId: adminUser.id,
        },
        [adminUser]
      );

      // Create a valid token
      const tokenData = `${group.id}:user@example.com:${Date.now()}`;
      validToken = Buffer.from(tokenData).toString("base64");
    });

    it("should accept invitation and add user to group", async () => {
      const response = await request(app)
        .post(`/api/invitations/${validToken}/accept`)
        .send({ userId: user.id })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.group).toHaveProperty("id", group.id);
      expect(response.body.group.members).toHaveLength(2);
      expect(response.body.group.members.map((m: any) => m.id)).toContain(
        user.id
      );
    });

    it("should return 400 if user is already a member", async () => {
      // First, add user to group
      await request(app)
        .post(`/api/invitations/${validToken}/accept`)
        .send({ userId: user.id })
        .expect(200);

      // Try to accept invitation again
      const response = await request(app)
        .post(`/api/invitations/${validToken}/accept`)
        .send({ userId: user.id })
        .expect(400);

      expect(response.body.error).toBe("Already a member of this group");
    });

    it("should return 400 for invalid token", async () => {
      const response = await request(app)
        .post("/api/invitations/invalid-token/accept")
        .send({ userId: user.id })
        .expect(400);

      expect(response.body.error).toBe("Invalid or expired invitation");
    });

    it("should handle errors gracefully", async () => {
      const response = await request(app)
        .post(`/api/invitations/${validToken}/accept`)
        .send({ userId: "invalid-user-id" })
        .expect(500);

      expect(response.body.error).toBe("Failed to accept invitation");
    });
  });
});
