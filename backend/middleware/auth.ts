import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

export const authenticateToken: RequestHandler = (req, res, next) => {
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

export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  // This would typically check the user's admin status from the database
  // For now, we'll let the individual routes handle admin checks
  next();
};
