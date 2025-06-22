import express, { RequestHandler } from "express";
import { getPrismaClient } from "../lib/prisma";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

// Create direct chat
const createDirectChatHandler: RequestHandler = async (req, res) => {
  const { userId, otherUserId } = req.body;
  const prisma = await getPrismaClient();

  try {
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
    res.status(500).json({ error: "Failed to create direct chat" });
  }
};

// Create group chat (admin only)
const createGroupChatHandler: RequestHandler = async (req, res) => {
  const { title, memberIds, isPublic } = req.body;
  const prisma = await getPrismaClient();

  try {
    const conversation = await prisma.conversation.create({
      data: {
        title,
        isGroup: true,
        isPublic: isPublic || false,
        members: {
          connect: memberIds.map((id: string) => ({ id })),
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
    console.error("Error creating group chat:", error);
    res.status(500).json({ error: "Failed to create group chat" });
  }
};

// Discover public groups
const discoverGroupsHandler: RequestHandler = async (req, res) => {
  const { userId } = req.params;
  const prisma = await getPrismaClient();

  try {
    // First check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(500).json({ error: "Failed to discover groups" });
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
    res.status(500).json({ error: "Failed to discover groups" });
  }
};

// Join group
const joinGroupHandler: RequestHandler = async (req, res) => {
  const { groupId } = req.params;
  const { userId } = req.body;
  const prisma = await getPrismaClient();

  try {
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
      where: { id: groupId },
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

    res.json(updatedGroup);
  } catch (error) {
    console.error("Error joining group:", error);
    res.status(500).json({ error: "Failed to join group" });
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
  const { userId } = req.body;
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

// Apply authentication middleware to all routes
router.use(authenticateToken);

router.post("/direct", createDirectChatHandler);
router.post("/group", createGroupChatHandler);
router.get("/discover/:userId", discoverGroupsHandler);
router.post("/:groupId/join", joinGroupHandler);
router.get("/:userId", listConversationsHandler);
router.get("/:userId/unread", getUnreadCountHandler);
router.post("/:conversationId/read", markAsReadHandler);

export default router;
