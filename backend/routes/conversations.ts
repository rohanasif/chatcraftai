import express, { RequestHandler } from "express";
import { getPrismaClient } from "../lib/prisma";
import {
  authenticateToken,
  requireAdmin,
  AuthenticatedRequest,
} from "../middleware/auth";

const router = express.Router();

// Create direct chat
const createDirectChatHandler: RequestHandler = async (req, res) => {
  const { targetEmail } = req.body;
  const userId = (req as AuthenticatedRequest).user?.userId;
  const prisma = await getPrismaClient();

  try {
    if (!userId || !targetEmail) {
      res.status(400).json({ error: "userId and targetEmail are required" });
      return;
    }
    // Find the target user by email
    const targetUser = await prisma.user.findUnique({
      where: { email: targetEmail },
      select: { id: true },
    });

    if (!targetUser) {
      res.status(404).json({ error: "User not found with that email address" });
      return;
    }

    const otherUserId = targetUser.id;

    // Check if conversation already exists
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        members: {
          every: {
            id: { in: [userId, otherUserId] },
          },
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
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (existingConversation && existingConversation._count.members === 2) {
      res.json(existingConversation);
      return;
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        isGroup: false,
        members: {
          connect: [{ id: userId }, { id: otherUserId }],
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
      },
    });

    res.json(conversation);
  } catch (error) {
    console.error("Error creating direct chat:", error);
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string };
      if (prismaError.code === "P2002") {
        res
          .status(409)
          .json({ error: "A direct chat with this user already exists." });
        return;
      }
    }
    res.status(500).json({
      error: "An unexpected error occurred while creating direct chat.",
    });
  }
};

// Create group chat (admin only)
const createGroupChatHandler: RequestHandler = async (req, res) => {
  const { title, memberEmails, isPublic } = req.body;
  const userId = (req as AuthenticatedRequest).user?.userId;
  const prisma = await getPrismaClient();

  try {
    if (
      !title ||
      !memberEmails ||
      !Array.isArray(memberEmails) ||
      memberEmails.length === 0
    ) {
      res.status(400).json({ error: "title and memberEmails[] are required" });
      return;
    }

    // Find all users by their emails
    const users = await prisma.user.findMany({
      where: {
        email: { in: memberEmails },
      },
      select: { id: true, email: true },
    });

    if (users.length !== memberEmails.length) {
      const foundEmails = users.map((user) => user.email);
      const missingEmails = memberEmails.filter(
        (email) => !foundEmails.includes(email),
      );
      res.status(404).json({
        error: `Users not found: ${missingEmails.join(", ")}`,
      });
      return;
    }

    const memberIds = users.map((user) => user.id);

    const conversation = await prisma.conversation.create({
      data: {
        title,
        isGroup: true,
        isPublic: isPublic || false,
        creator: {
          connect: { id: userId },
        },
        members: {
          connect: memberIds.map((id: string) => ({ id })),
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        members: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    res.json(conversation);
  } catch (error) {
    console.error("Error creating group chat:", error);
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string };
      if (prismaError.code === "P2002") {
        res
          .status(409)
          .json({ error: "A group chat with these members already exists." });
        return;
      }
    }
    res.status(500).json({
      error: "An unexpected error occurred while creating group chat.",
    });
  }
};

// Discover public groups
const discoverGroupsHandler: RequestHandler = async (req, res) => {
  const { userId } = req.params;
  const prisma = await getPrismaClient();

  try {
    if (!userId) {
      res.status(400).json({ error: "userId is required" });
      return;
    }
    // First check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const groups = await prisma.conversation.findMany({
      where: {
        isGroup: true,
        isPublic: true,
        members: {
          none: { id: userId },
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        members: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            members: true,
            messages: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(groups);
  } catch (error) {
    console.error("Error discovering groups:", error);
    res.status(500).json({
      error: "An unexpected error occurred while discovering groups.",
    });
  }
};

// Join group
const joinGroupHandler: RequestHandler = async (req, res) => {
  const { groupId } = req.params;
  const { userId: targetUserId } = req.body;
  const prisma = await getPrismaClient();

  try {
    if (!groupId || !targetUserId) {
      res.status(400).json({ error: "groupId and userId are required" });
      return;
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      res
        .status(500)
        .json({ error: "An unexpected error occurred while joining group." });
      return;
    }

    // Check if group exists and is public
    const group = await prisma.conversation.findUnique({
      where: { id: groupId },
    });

    if (!group || !group.isGroup || !group.isPublic) {
      res.status(404).json({ error: "Group not found or not joinable" });
      return;
    }

    // Check if user is already a member
    const isMember = await prisma.conversation.findFirst({
      where: {
        id: groupId,
        members: {
          some: { id: targetUserId },
        },
      },
    });

    if (isMember) {
      res.status(400).json({ error: "Already a member of this group" });
      return;
    }

    // Add user to group
    const updatedGroup = await prisma.conversation.update({
      where: { id: groupId },
      data: {
        members: {
          connect: { id: targetUserId },
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
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

    res.json(updatedGroup);
  } catch (error) {
    console.error("Error joining group:", error);
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string };
      if (prismaError.code === "P2002") {
        res
          .status(409)
          .json({ error: "You are already a member of this group." });
        return;
      }
    }
    res
      .status(500)
      .json({ error: "An unexpected error occurred while joining group." });
  }
};

// List conversations for user with unread counts
const listConversationsHandler: RequestHandler = async (req, res) => {
  const { userId } = req.params;
  const prisma = await getPrismaClient();

  try {
    // First check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(500).json({ error: "Failed to fetch conversations" });
      return;
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        members: {
          some: { id: userId },
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
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
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Format response to include conversation name and unread count
    const formattedConversations = conversations.map((convo) => {
      if (convo.isGroup) {
        return {
          ...convo,
          unreadCount: 0, // Simplified for now
          lastMessageRead: true,
        };
      }

      // For 1:1 chats, set title to the other user's name
      const otherUser = convo.members.find((member) => member.id !== userId);
      return {
        ...convo,
        title: otherUser?.name || "Unknown User",
        unreadCount: 0, // Simplified for now
        lastMessageRead: true,
      };
    });

    res.json(formattedConversations);
  } catch (error) {
    console.error("Error listing conversations:", error);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
};

// Get unread count for a user (all conversations) or specific conversation
const getUnreadCountHandler: RequestHandler = async (req, res) => {
  const { userId } = req.params;
  const prisma = await getPrismaClient();

  try {
    // First check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(500).json({ error: "Failed to get unread count" });
      return;
    }

    // Get total unread count across all conversations for this user
    const unreadCount = await prisma.message.count({
      where: {
        conversation: {
          members: {
            some: { id: userId },
          },
        },
        readBy: {
          none: { id: userId },
        },
      },
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({ error: "Failed to get unread count" });
  }
};

// Mark conversation as read
const markAsReadHandler: RequestHandler = async (req, res) => {
  const { conversationId } = req.params;
  const userId = (req as AuthenticatedRequest).user?.userId;
  const prisma = await getPrismaClient();

  try {
    // First check if conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      res.status(500).json({ error: "Failed to mark as read" });
      return;
    }

    // Get all unread messages in the conversation
    const unreadMessages = await prisma.message.findMany({
      where: {
        conversationId,
        senderId: { not: userId },
        readBy: {
          none: { id: userId },
        },
      },
      select: { id: true },
    });

    // Mark all unread messages as read
    if (unreadMessages.length > 0) {
      for (const message of unreadMessages) {
        await prisma.message.update({
          where: { id: message.id },
          data: {
            readBy: {
              connect: { id: userId },
            },
          },
        });
      }
    }

    res.json({ success: true, markedAsRead: unreadMessages.length });
  } catch (error) {
    console.error("Error marking as read:", error);
    res.status(500).json({ error: "Failed to mark as read" });
  }
};

// Admin: Get all groups for management
const getAllGroupsHandler: RequestHandler = async (req, res) => {
  const prisma = await getPrismaClient();

  try {
    const groups = await prisma.conversation.findMany({
      where: {
        isGroup: true,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        members: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            members: true,
            messages: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(groups);
  } catch (error) {
    console.error("Error getting all groups:", error);
    res.status(500).json({
      error: "An unexpected error occurred while fetching groups.",
    });
  }
};

// Admin: Update group settings
const updateGroupHandler: RequestHandler = async (req, res) => {
  const { groupId } = req.params;
  const { title, isPublic, memberEmails } = req.body;
  const prisma = await getPrismaClient();

  try {
    if (!groupId) {
      res.status(400).json({ error: "groupId is required" });
      return;
    }

    // Check if group exists
    const existingGroup = await prisma.conversation.findUnique({
      where: { id: groupId },
    });

    if (!existingGroup || !existingGroup.isGroup) {
      res.status(404).json({ error: "Group not found" });
      return;
    }

    const updateData: {
      title?: string;
      isPublic?: boolean;
      members?: { set: { id: string }[] };
    } = {};

    if (title !== undefined) {
      updateData.title = title;
    }

    if (isPublic !== undefined) {
      updateData.isPublic = isPublic;
    }

    // Handle member updates if provided
    if (memberEmails && Array.isArray(memberEmails)) {
      // Find all users by their emails
      const users = await prisma.user.findMany({
        where: {
          email: { in: memberEmails },
        },
        select: { id: true, email: true },
      });

      if (users.length !== memberEmails.length) {
        const foundEmails = users.map((user) => user.email);
        const missingEmails = memberEmails.filter(
          (email) => !foundEmails.includes(email),
        );
        res.status(404).json({
          error: `Users not found: ${missingEmails.join(", ")}`,
        });
        return;
      }

      const memberIds = users.map((user) => user.id);
      updateData.members = {
        set: memberIds.map((id: string) => ({ id })),
      };
    }

    const updatedGroup = await prisma.conversation.update({
      where: { id: groupId },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        members: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            members: true,
            messages: true,
          },
        },
      },
    });

    res.json(updatedGroup);
  } catch (error) {
    console.error("Error updating group:", error);
    res.status(500).json({
      error: "An unexpected error occurred while updating group.",
    });
  }
};

// Admin: Delete group
const deleteGroupHandler: RequestHandler = async (req, res) => {
  const { groupId } = req.params;
  const prisma = await getPrismaClient();

  try {
    if (!groupId) {
      res.status(400).json({ error: "groupId is required" });
      return;
    }

    // Check if group exists
    const existingGroup = await prisma.conversation.findUnique({
      where: { id: groupId },
    });

    if (!existingGroup || !existingGroup.isGroup) {
      res.status(404).json({ error: "Group not found" });
      return;
    }

    // Delete the group (this will cascade delete messages due to foreign key constraints)
    await prisma.conversation.delete({
      where: { id: groupId },
    });

    res.json({ success: true, message: "Group deleted successfully" });
  } catch (error) {
    console.error("Error deleting group:", error);
    res.status(500).json({
      error: "An unexpected error occurred while deleting group.",
    });
  }
};

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Routes that require user authentication
router.post("/direct", createDirectChatHandler);
router.get("/discover/:userId", discoverGroupsHandler);
router.post("/:groupId/join", joinGroupHandler);
router.get("/:userId", listConversationsHandler);
router.get("/:userId/unread", getUnreadCountHandler);
router.post("/:conversationId/read", markAsReadHandler);

// Admin-only routes
router.post("/group", requireAdmin, createGroupChatHandler);
router.get("/admin/groups", requireAdmin, getAllGroupsHandler);
router.put("/admin/groups/:groupId", requireAdmin, updateGroupHandler);
router.delete("/admin/groups/:groupId", requireAdmin, deleteGroupHandler);

export default router;
