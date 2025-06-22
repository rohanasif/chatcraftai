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
});
