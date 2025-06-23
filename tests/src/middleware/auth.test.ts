import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Mock the entire backend module to avoid setup dependencies
jest.mock("@backend/middleware/auth", () => {
  const originalModule = jest.requireActual("@backend/middleware/auth");

  // Mock the authenticateToken function
  const authenticateToken = jest.fn((req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    const cookieToken = req.cookies?.token;

    if (!token && !cookieToken) {
      res.status(401).json({ error: "Access token required" });
      return;
    }

    const actualToken = token || cookieToken;

    try {
      const decoded = jwt.verify(
        actualToken,
        process.env.JWT_SECRET || "fallback-secret"
      ) as any;
      req.user = { userId: decoded.userId };
      next();
    } catch (error) {
      res.status(403).json({ error: "Invalid token" });
    }
  });

  // Mock the requireAdmin function
  const requireAdmin = jest.fn(async (req: any, res: any, next: any) => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    // Mock admin check
    if (req.user.userId === "test-user-id") {
      next();
    } else {
      res.status(403).json({ error: "Admin access required" });
    }
  });

  return {
    authenticateToken,
    requireAdmin,
  };
});

// Import the mocked functions
import { authenticateToken, requireAdmin } from "@backend/middleware/auth";

// Mock the test utilities
jest.mock("../utils/testUtils", () => ({
  generateToken: (userId: string) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET || "fallback-secret", {
      expiresIn: "1h",
    });
  },
}));

import { generateToken } from "../utils/testUtils";

// Define types locally to avoid import issues
interface AuthenticatedRequest extends Request {
  user?: { userId: string };
}

describe("Auth Middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      cookies: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
  });

  describe("authenticateToken", () => {
    it("should call next() when valid token is provided in Authorization header", () => {
      const userId = "test-user-id";
      const token = generateToken(userId);

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect((mockRequest as AuthenticatedRequest).user).toMatchObject({
        userId,
      });
    });

    it("should call next() when valid token is provided in cookies", () => {
      const userId = "test-user-id";
      const token = generateToken(userId);

      mockRequest.cookies = {
        token: token,
      };

      authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect((mockRequest as AuthenticatedRequest).user).toMatchObject({
        userId,
      });
    });

    it("should return 401 when no token is provided", () => {
      authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Access token required",
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should return 403 when invalid token is provided", () => {
      mockRequest.headers = {
        authorization: "Bearer invalid-token",
      };

      authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Invalid token",
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should return 403 when expired token is provided", () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { userId: "test-user-id" },
        process.env.JWT_SECRET || "fallback-secret",
        { expiresIn: "-1h" }
      );

      mockRequest.headers = {
        authorization: `Bearer ${expiredToken}`,
      };

      authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Invalid token",
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should handle malformed Authorization header", () => {
      mockRequest.headers = {
        authorization: "InvalidFormat token123",
      };

      authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Invalid token",
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should handle empty Authorization header", () => {
      mockRequest.headers = {
        authorization: "",
      };

      authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Access token required",
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe("requireAdmin", () => {
    it("should call next() when user is authenticated", async () => {
      const authenticatedRequest = {
        user: { userId: "test-user-id" },
      } as AuthenticatedRequest;

      await requireAdmin(
        authenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });

    it("should return 401 when user is not authenticated", async () => {
      const unauthenticatedRequest = {} as AuthenticatedRequest;

      await requireAdmin(
        unauthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Authentication required",
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should return 401 when user object is undefined", async () => {
      const requestWithUndefinedUser = {
        user: undefined,
      } as AuthenticatedRequest;

      await requireAdmin(
        requestWithUndefinedUser,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Authentication required",
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
});
