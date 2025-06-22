import request from "supertest";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// Import routes directly
import authRouter from "../../../backend/routes/auth";
import conversationsRouter from "../../../backend/routes/conversations";
import messagesRouter from "../../../backend/routes/messages";
import invitationsRouter from "../../../backend/routes/invitations";

describe("Application Integration Tests", () => {
  let app: express.Application;

  beforeAll(() => {
    // Create test app
    app = express();

    // Middleware
    app.use(
      cors({
        origin: "http://localhost:3000",
        credentials: true,
      })
    );
    app.use(express.json());
    app.use(cookieParser());

    // Routes
    app.use("/api/auth", authRouter);
    app.use("/api/conversations", conversationsRouter);
    app.use("/api/messages", messagesRouter);
    app.use("/api/invitations", invitationsRouter);

    // Health check endpoint
    app.get("/health", (req, res) => {
      res.status(200).json({ status: "healthy" });
    });

    // 404 middleware for unknown routes
    app.use((req, res) => {
      res.status(404).json({ error: "Route not found" });
    });

    // Error handling middleware
    app.use((err: Error, req: express.Request, res: express.Response) => {
      console.error(err.stack);
      res.status(500).json({ error: "Something went wrong!" });
    });
  });

  describe("Health Check", () => {
    it("should return healthy status", async () => {
      const response = await request(app).get("/health");
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: "healthy" });
    });
  });

  describe("API Routes", () => {
    it("should have auth routes available", async () => {
      const response = await request(app).post("/api/auth/register");
      // Should not be 404 (route exists)
      expect(response.status).not.toBe(404);
    });

    it("should have conversations routes available", async () => {
      const response = await request(app).get("/api/conversations/test-user");
      // Should not be 404 (route exists)
      expect(response.status).not.toBe(404);
    });

    it("should have messages routes available", async () => {
      const response = await request(app).get(
        "/api/messages/test-conversation"
      );
      // Should not be 404 (route exists)
      expect(response.status).not.toBe(404);
    });

    it("should have invitations routes available", async () => {
      const response = await request(app).post("/api/invitations/send");
      // Should not be 404 (route exists)
      expect(response.status).not.toBe(404);
    });
  });

  describe("Error Handling", () => {
    it("should handle 404 for unknown routes", async () => {
      const response = await request(app).get("/api/unknown");
      expect(response.status).toBe(404);
    });
  });
});
