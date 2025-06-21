import express, { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";

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
  const { userId, title, memberEmails } = req.body;

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

// List conversations for user
const listConversationsHandler: RequestHandler = async (req, res) => {
  const { userId } = req.params;

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

  // Format response to include conversation name (title or other user's name for 1:1)
  const formattedConversations = conversations.map((convo) => {
    if (convo.isGroup) {
      return convo;
    }

    // For 1:1 chats, set title to the other user's name
    const otherUser = convo.members.find((member) => member.id !== userId);
    return {
      ...convo,
      title: otherUser?.name || "Unknown User",
    };
  });

  res.json(formattedConversations);
};

router.post("/direct", createDirectChatHandler);
router.post("/group", createGroupChatHandler);
router.get("/:userId", listConversationsHandler);

export default router;
