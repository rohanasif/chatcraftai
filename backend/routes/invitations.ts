import express, { RequestHandler } from "express";
import { getPrismaClient } from "../lib/prisma";
import { EmailService } from "../services/emailService";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth";

const router = express.Router();

// Send group invitations (admin only)
const sendInvitationsHandler: RequestHandler = async (req, res) => {
  const { groupId, inviteeEmails } = req.body;
  const userId = (req as AuthenticatedRequest).user?.userId;
  const prisma = await getPrismaClient();

  try {
    if (
      !groupId ||
      !inviteeEmails ||
      !Array.isArray(inviteeEmails) ||
      inviteeEmails.length === 0
    ) {
      res
        .status(400)
        .json({ error: "groupId and inviteeEmails[] are required" });
      return;
    }
    // Check if user is admin and group creator
    const group = await prisma.conversation.findFirst({
      where: {
        id: groupId,
        isGroup: true,
        creatorId: userId,
      },
      select: {
        id: true,
        title: true,
        creator: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!group) {
      res
        .status(403)
        .json({ error: "Only group creators can send invitations" });
      return;
    }

    // Send invitations
    await EmailService.sendGroupInvitation(
      groupId,
      group.title || "Untitled Group",
      group.creator?.email || "",
      inviteeEmails,
    );

    res.json({ success: true, message: "Invitations sent successfully" });
  } catch (error) {
    console.error("Failed to send invitations:", error);
    res.status(500).json({
      error: "An unexpected error occurred while sending invitations.",
    });
  }
};

// Validate invitation token
const validateInvitationHandler: RequestHandler = async (req, res) => {
  const { token } = req.params;
  const prisma = await getPrismaClient();

  try {
    if (!token) {
      res.status(400).json({ error: "Invitation token is required" });
      return;
    }
    const validation = await EmailService.validateInvitationToken(token);

    if (!validation.valid) {
      res.status(400).json({ error: "Invalid or expired invitation" });
      return;
    }

    // Get group details
    const group = await prisma.conversation.findUnique({
      where: { id: validation.groupId },
      select: {
        id: true,
        title: true,
        isGroup: true,
        members: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    res.json({
      valid: true,
      group,
      email: validation.email,
    });
  } catch (error) {
    console.error("Failed to validate invitation:", error);
    res.status(500).json({
      error: "An unexpected error occurred while validating invitation.",
    });
  }
};

// Accept invitation
const acceptInvitationHandler: RequestHandler = async (req, res) => {
  const { token } = req.params;
  const { userId } = req.body;
  const prisma = await getPrismaClient();

  try {
    if (!token || !userId) {
      res.status(400).json({ error: "token and userId are required" });
      return;
    }
    const validation = await EmailService.validateInvitationToken(token);

    if (!validation.valid) {
      res.status(400).json({ error: "Invalid or expired invitation" });
      return;
    }

    // Check if user is already a member
    const isMember = await prisma.conversation.findFirst({
      where: {
        id: validation.groupId,
        members: {
          some: { id: userId },
        },
      },
    });

    if (isMember) {
      res.status(400).json({ error: "Already a member of this group" });
      return;
    }

    // Add user to group
    const updatedGroup = await prisma.conversation.update({
      where: { id: validation.groupId },
      data: {
        members: {
          connect: { id: userId },
        },
      },
      include: {
        members: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    res.json({ success: true, group: updatedGroup });
  } catch (error) {
    console.error("Failed to accept invitation:", error);
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string };
      if (prismaError.code === "P2002") {
        res
          .status(409)
          .json({ error: "You are already a member of this group." });
        return;
      }
    }
    res.status(500).json({
      error: "An unexpected error occurred while accepting invitation.",
    });
  }
};

// Apply authentication middleware to protected routes
router.post("/send", authenticateToken, sendInvitationsHandler);
router.post("/:token/accept", acceptInvitationHandler);

// Public route for token validation
router.get("/:token/validate", validateInvitationHandler);

export default router;
