import express, { RequestHandler } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getPrismaClient } from "../lib/prisma";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth";

const router = express.Router();

// Register
const registerHandler: RequestHandler = async (req, res) => {
  const { email, password, name, avatar, isAdmin } = req.body;
  const prisma = await getPrismaClient();

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
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

    res.cookie("token", token, { httpOnly: true });
    res.json({ user });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(400).json({ error: "User already exists" });
  }
};

// Login
const loginHandler: RequestHandler = async (req, res) => {
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

  res.cookie("token", token, { httpOnly: true });
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
const logoutHandler: RequestHandler = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    maxAge: 0,
  });
  res.json({ success: true });
};

// Get current user (protected route)
const getCurrentUserHandler: RequestHandler = async (req, res) => {
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

// Public routes
router.post("/register", registerHandler);
router.post("/login", loginHandler);
router.post("/logout", logoutHandler);

// Protected routes
router.get("/me", authenticateToken, getCurrentUserHandler);

export default router;
