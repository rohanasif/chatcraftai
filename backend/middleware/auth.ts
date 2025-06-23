import { Request, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { getPrismaClient } from "../lib/prisma";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    isAdmin?: boolean;
  };
}

export const authenticateToken: RequestHandler = async (req, res, next) => {
  let token;
  try {
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization) {
      const parts = req.headers.authorization.split(" ");
      if (parts.length === 2 && parts[0] === "Bearer") {
        token = parts[1];
      } else {
        throw new Error("Malformed Authorization header");
      }
    }
  } catch (tokenError) {
    console.error("[authenticateToken] Token extraction error:", tokenError);
    res.status(401).json({ error: "Access token required" });
    return;
  }

  if (!token) {
    res.status(401).json({ error: "Access token required" });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    (req as AuthenticatedRequest).user = decoded as { userId: string };
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    res.status(403).json({ error: "Invalid token" });
    return;
  }
};

export const requireAdmin: RequestHandler = async (req, res, next) => {
  try {
    const userId = (req as AuthenticatedRequest).user?.userId;

    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const prisma = await getPrismaClient();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isAdmin: true },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (!user.isAdmin) {
      res.status(403).json({ error: "Admin access required" });
      return;
    }

    // Add admin status to request for use in subsequent middleware/routes
    (req as AuthenticatedRequest).user!.isAdmin = user.isAdmin;
    next();
  } catch (error) {
    console.error("Admin check error:", error);
    res.status(500).json({ error: "Failed to verify admin status" });
    return;
  }
};

export const requireUserOrAdmin: RequestHandler = async (req, res, next) => {
  try {
    const userId = (req as AuthenticatedRequest).user?.userId;

    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const prisma = await getPrismaClient();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isAdmin: true },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Add admin status to request for use in subsequent middleware/routes
    (req as AuthenticatedRequest).user!.isAdmin = user.isAdmin;
    next();
  } catch (error) {
    console.error("User check error:", error);
    res.status(500).json({ error: "Failed to verify user status" });
    return;
  }
};
