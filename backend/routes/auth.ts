import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getPrismaClient } from "../lib/prisma";
import {
  authenticateToken,
  AuthenticatedRequest,
  requireAdmin,
} from "../middleware/auth";

const router = express.Router();

// Register
const registerHandler = async (req, res) => {
  const { email, password, name, avatar, isAdmin } = req.body;

  // Validate required fields
  if (!email || !password || !name) {
    return res
      .status(400)
      .json({ error: "Email, password, and name are required" });
  }

  const prisma = await getPrismaClient();

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        avatar,
        isAdmin: isAdmin || false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        isAdmin: true,
      },
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS-only in prod
      sameSite: "lax",
      path: "/", // 👈 makes it available site-wide
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });
    res.json({ user });
  } catch (error) {
    console.error("Registration error:", error);

    // Handle specific Prisma errors
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string };

      if (prismaError.code === "P2002") {
        return res.status(400).json({ error: "User already exists" });
      }

      if (prismaError.code === "P2003") {
        return res.status(400).json({ error: "Invalid data provided" });
      }
    }

    res.status(500).json({ error: "Registration failed. Please try again." });
  }
};

// Login
const loginHandler = async (req, res) => {
  const { email, password } = req.body;
  const prisma = await getPrismaClient();

  // Check if credentials are provided
  if (!email || !password) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
      name: true,
      avatar: true,
      isAdmin: true,
    },
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
    expiresIn: "1h",
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // HTTPS-only in prod
    sameSite: "lax",
    path: "/", // 👈 makes it available site-wide
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  });
  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      isAdmin: user.isAdmin,
    },
  });
};

// Logout
const logoutHandler = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    maxAge: 0,
  });
  res.json({ success: true });
};

// Get current user (protected route)
const getCurrentUserHandler = async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).user?.userId;
    const prisma = await getPrismaClient();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        isAdmin: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error("Error getting current user:", error);
    res.status(500).json({ error: "Failed to get current user" });
  }
};

// Get JWT token for WebSocket connections (protected route)
const getTokenHandler = async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).user?.userId;

    if (!userId) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    // Generate a new token for WebSocket connections
    const token = jwt.sign({ userId }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });

    res.json({ token });
  } catch (error) {
    console.error("Error generating token:", error);
    res.status(500).json({ error: "Failed to generate token" });
  }
};

// Admin: Get all users
const getAllUsersHandler = async (req, res) => {
  try {
    const prisma = await getPrismaClient();

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            createdConversations: true,
            memberConversations: true,
            sentMessages: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({ users });
  } catch (error) {
    console.error("Error getting all users:", error);
    res.status(500).json({ error: "Failed to get users" });
  }
};

// Admin: Update user role
const updateUserRoleHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isAdmin } = req.body;

    if (typeof isAdmin !== "boolean") {
      res.status(400).json({ error: "isAdmin must be a boolean" });
      return;
    }

    const prisma = await getPrismaClient();

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isAdmin },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ user });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ error: "Failed to update user role" });
  }
};

// Admin: Delete user
const deleteUserHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const prisma = await getPrismaClient();

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Delete the user (this will cascade delete related data due to foreign key constraints)
    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

// Public routes
router.post("/register", registerHandler);
router.post("/login", loginHandler);
router.post("/logout", logoutHandler);

// Protected routes
router.get("/me", authenticateToken, getCurrentUserHandler);
router.get("/token", authenticateToken, getTokenHandler);

// Admin-only routes
router.get("/admin/users", authenticateToken, requireAdmin, getAllUsersHandler);
router.put(
  "/admin/users/:userId/role",
  authenticateToken,
  requireAdmin,
  updateUserRoleHandler,
);
router.delete(
  "/admin/users/:userId",
  authenticateToken,
  requireAdmin,
  deleteUserHandler,
);

export default router;
