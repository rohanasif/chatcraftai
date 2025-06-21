import express, { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();
const prisma = new PrismaClient();

// Create 1:1 chat
const createDirectChatHandler: RequestHandler = async (req, res) => {
  const { userId, targetEmail } = req.body;

  const targetUser = await prisma.user.findUnique({
    where: { email: targetEmail },
    select: { id: true },
  });

  if (!targetUser) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // Check if conversation already exists between these users
  const existingConvo = await prisma.conversation.findFirst({
    where: {
      isGroup: false,
      members: {
        some: { id: userId },
      },
      AND: {
        members: {
          some: { id: targetUser.id },
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
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (existingConvo) {
    res.json(existingConvo);
    return;
  }

  const conversation = await prisma.conversation.create({
    data: {
      isGroup: false,
      members: {
        connect: [{ id: userId }, { id: targetUser.id }],
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

  res.json(conversation);
};

// Create group chat (admin only)
const createGroupChatHandler: RequestHandler = async (req, res) => {
  const { userId, title, memberEmails, isPublic = false } = req.body;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  });

  if (!user?.isAdmin) {
    res.status(403).json({ error: "Only admins can create groups" });
    return;
  }

  const members = await prisma.user.findMany({
    where: {
      email: { in: memberEmails },
    },
    select: {
      id: true,
    },
  });

  const memberIds = members.map((member) => ({ id: member.id }));

  const conversation = await prisma.conversation.create({
    data: {
      title,
      isGroup: true,
      isPublic,
      creator: { connect: { id: userId } },
      members: {
        connect: memberIds,
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

  res.json(conversation);
};

// Discover public groups (for non-admin users)
const discoverGroupsHandler: RequestHandler = async (req, res) => {
  const { userId } = req.params;

  try {
    const publicGroups = await prisma.conversation.findMany({
      where: {
        isGroup: true,
        isPublic: true,
        members: {
          none: { id: userId }, // Groups the user is not already a member of
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
        _count: {
          select: {
            members: true,
            messages: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    res.json(publicGroups);
  } catch (error) {
    console.error("Error discovering groups:", error);
    res.status(500).json({ error: "Failed to discover groups" });
  }
};

// Join a public group
const joinGroupHandler: RequestHandler = async (req, res) => {
  const { groupId } = req.params;
  const { userId } = req.body;

  try {
    // Check if group exists and is public
    const group = await prisma.conversation.findFirst({
      where: {
        id: groupId,
        isGroup: true,
        isPublic: true,
      },
    });

    if (!group) {
      res.status(404).json({ error: "Group not found or not public" });
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

  try {
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
          include: {
            readBy: {
              where: { id: userId },
              select: { id: true },
            },
          },
        },
        _count: {
          select: {
            messages: {
              where: {
                readBy: {
                  none: { id: userId },
                },
                senderId: { not: userId },
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Format response to include conversation name and unread count
    const formattedConversations = conversations.map((convo) => {
      const lastMessage = convo.messages[0];
      const isLastMessageRead = lastMessage?.readBy.length > 0;

      if (convo.isGroup) {
        return {
          ...convo,
          unreadCount: convo._count.messages,
          lastMessageRead: isLastMessageRead,
        };
      }

      // For 1:1 chats, set title to the other user's name
      const otherUser = convo.members.find((member) => member.id !== userId);
      return {
        ...convo,
        title: otherUser?.name || "Unknown User",
        unreadCount: convo._count.messages,
        lastMessageRead: isLastMessageRead,
      };
    });

    res.json(formattedConversations);
  } catch (error) {
    console.error("Error listing conversations:", error);
    res.status(500).json({ error: "Failed to list conversations" });
  }
};

// Get unread count for a conversation
const getUnreadCountHandler: RequestHandler = async (req, res) => {
  const { conversationId } = req.params;
  const { userId } = req.query;

  try {
    const unreadCount = await prisma.message.count({
      where: {
        conversationId,
        senderId: { not: userId as string },
        readBy: {
          none: { id: userId as string },
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

  try {
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
      await prisma.message.updateMany({
        where: {
          id: { in: unreadMessages.map((m) => m.id) },
        },
        data: {
          readBy: {
            connect: { id: userId },
          },
        },
      });
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
router.get("/:conversationId/unread", getUnreadCountHandler);
router.post("/:conversationId/read", markAsReadHandler);

export default router;
