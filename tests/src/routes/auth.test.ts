import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "@backend/routes/auth";
import {
  createTestUser,
  setupTestDatabase,
  teardownTestDatabase,
  cleanupTestData,
  generateToken,
} from "../utils/testUtils";

describe("Auth Routes", () => {
  let app: express.Application;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await cleanupTestData();
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use("/api/auth", authRouter);
  });

  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const userData = {
        email: "test@example.com",
        password: "password123",
        name: "Test User",
        avatar: "https://example.com/avatar.jpg",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(200);

      expect(response.body).toHaveProperty("user");
      expect(response.body.user).toHaveProperty("id");
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.name).toBe(userData.name);
      expect(response.body.user.avatar).toBe(userData.avatar);
      expect(response.body.user).not.toHaveProperty("password");
      expect(response.headers["set-cookie"]).toBeDefined();
    });

    it("should register an admin user when isAdmin is true", async () => {
      const userData = {
        email: "admin@example.com",
        password: "password123",
        name: "Admin User",
        isAdmin: true,
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(200);

      expect(response.body.user.isAdmin).toBe(true);
    });

    it("should return 400 when user already exists", async () => {
      const userData = {
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      };

      // Register user first time
      await request(app).post("/api/auth/register").send(userData).expect(200);

      // Try to register same user again
      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe("User already exists");
    });

    it("should hash password before storing", async () => {
      const userData = {
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      };

      await request(app).post("/api/auth/register").send(userData).expect(200);

      // Verify password was hashed (we can't directly check, but we can verify the user can login)
      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty("user");
    });
  });

  describe("POST /api/auth/login", () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await createTestUser({
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      });
    });

    it("should login user with valid credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty("user");
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.name).toBe(testUser.name);
      expect(response.body.user).not.toHaveProperty("password");
      expect(response.headers["set-cookie"]).toBeDefined();
    });

    it("should return 401 with invalid email", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "password123",
        })
        .expect(401);

      expect(response.body.error).toBe("Invalid credentials");
    });

    it("should return 401 with invalid password", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: "wrongpassword",
        })
        .expect(401);

      expect(response.body.error).toBe("Invalid credentials");
    });

    it("should return 401 with missing credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({})
        .expect(401);

      expect(response.body.error).toBe("Invalid credentials");
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should clear authentication cookie", async () => {
      const response = await request(app).post("/api/auth/logout").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.headers["set-cookie"]).toBeDefined();

      // Check that cookie is cleared (expired)
      const cookies = response.headers["set-cookie"];
      const logoutCookie = cookies?.find((cookie: string) =>
        cookie.includes("token")
      );
      expect(logoutCookie).toContain("Expires=Thu, 01 Jan 1970 00:00:00 GMT");
    });
  });

  describe("GET /api/auth/me", () => {
    let testUser: any;
    let authToken: string;

    beforeEach(async () => {
      testUser = await createTestUser({
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      });
      authToken = generateToken(testUser.id);
    });

    it("should return current user with valid token", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("user");
      expect(response.body.user.id).toBe(testUser.id);
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.name).toBe(testUser.name);
    });

    it("should return current user with valid cookie token", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Cookie", `token=${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("user");
      expect(response.body.user.id).toBe(testUser.id);
    });

    it("should return 401 without token", async () => {
      const response = await request(app).get("/api/auth/me").expect(401);

      expect(response.body.error).toBe("Access token required");
    });

    it("should return 403 with invalid token", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid-token")
        .expect(403);

      expect(response.body.error).toBe("Invalid token");
    });

    it("should return 404 when user not found", async () => {
      // Generate token for non-existent user
      const invalidToken = generateToken("non-existent-user-id");

      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${invalidToken}`)
        .expect(404);

      expect(response.body.error).toBe("User not found");
    });
  });

  describe("Admin Routes", () => {
    let adminToken: string;
    let userToken: string;
    let adminUser: any;
    let regularUser: any;

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
    });

    describe("GET /auth/admin/users", () => {
      it("should allow admin to get all users", async () => {
        const response = await request(app)
          .get("/api/auth/admin/users")
          .set("Cookie", adminToken);

        expect(response.status).toBe(200);
        expect(response.body.users).toBeDefined();
        expect(Array.isArray(response.body.users)).toBe(true);
        expect(response.body.users.length).toBeGreaterThan(0);
      });

      it("should deny regular user access to admin endpoint", async () => {
        const response = await request(app)
          .get("/api/auth/admin/users")
          .set("Cookie", userToken);

        expect(response.status).toBe(403);
        expect(response.body.error).toBe("Admin access required");
      });

      it("should deny unauthenticated access", async () => {
        const response = await request(app).get("/api/auth/admin/users");

        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Access token required");
      });
    });

    describe("PUT /auth/admin/users/:userId/role", () => {
      it("should allow admin to update user role", async () => {
        const response = await request(app)
          .put(`/api/auth/admin/users/${regularUser.id}/role`)
          .set("Cookie", adminToken)
          .send({ isAdmin: true });

        expect(response.status).toBe(200);
        expect(response.body.user.isAdmin).toBe(true);
      });

      it("should deny regular user access to role update", async () => {
        const response = await request(app)
          .put(`/api/auth/admin/users/${adminUser.id}/role`)
          .set("Cookie", userToken)
          .send({ isAdmin: false });

        expect(response.status).toBe(403);
        expect(response.body.error).toBe("Admin access required");
      });

      it("should validate isAdmin parameter", async () => {
        const response = await request(app)
          .put(`/api/auth/admin/users/${regularUser.id}/role`)
          .set("Cookie", adminToken)
          .send({ isAdmin: "invalid" });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe("isAdmin must be a boolean");
      });
    });

    describe("DELETE /auth/admin/users/:userId", () => {
      it("should allow admin to delete user", async () => {
        // Create a user to delete
        const userToDelete = await request(app)
          .post("/api/auth/register")
          .send({
            email: "delete@test.com",
            password: "delete123",
            name: "Delete User",
          });

        const response = await request(app)
          .delete(`/api/auth/admin/users/${userToDelete.body.user.id}`)
          .set("Cookie", adminToken);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it("should deny regular user access to delete user", async () => {
        const response = await request(app)
          .delete(`/api/auth/admin/users/${adminUser.id}`)
          .set("Cookie", userToken);

        expect(response.status).toBe(403);
        expect(response.body.error).toBe("Admin access required");
      });

      it("should return 404 for non-existent user", async () => {
        const response = await request(app)
          .delete("/api/auth/admin/users/non-existent-id")
          .set("Cookie", adminToken);

        expect(response.status).toBe(404);
        expect(response.body.error).toBe("User not found");
      });
    });
  });
});
