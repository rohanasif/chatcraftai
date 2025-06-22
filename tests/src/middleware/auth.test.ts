import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import {
  authenticateToken,
  requireAdmin,
  AuthenticatedRequest,
} from "@backend/middleware/auth";
import { generateToken } from "../utils/testUtils";

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
        process.env.JWT_SECRET!,
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

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Access token required",
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
    it("should call next() when user is authenticated", () => {
      const authenticatedRequest = {
        user: { userId: "test-user-id" },
      } as AuthenticatedRequest;

      requireAdmin(
        authenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });

    it("should return 401 when user is not authenticated", () => {
      const unauthenticatedRequest = {} as AuthenticatedRequest;

      requireAdmin(
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

    it("should return 401 when user object is undefined", () => {
      const requestWithUndefinedUser = {
        user: undefined,
      } as AuthenticatedRequest;

      requireAdmin(
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
