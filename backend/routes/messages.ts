import express, { RequestHandler } from "express";
import { getPrismaClient } from "../lib/prisma";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth";
import { AIService } from "../aiService";

const router = express.Router();

// Get messages for a conversation
const getMessagesHandler: RequestHandler = async (req, res) => {
  const { conversationId } = req.params;
  const { limit = 50, cursor } = req.query;

  try {
    if (!conversationId) {
      res.status(400).json({ error: "conversationId is required" });
      return;
    }
    const prisma = await getPrismaClient();

    // First check if conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    let cursorFilter = {};
    if (cursor) {
      // Expect cursor to be an ISO string or timestamp
      const cursorDate = new Date(cursor as string);
      if (!isNaN(cursorDate.getTime())) {
        cursorFilter = { createdAt: { lt: cursorDate } };
      }
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        ...cursorFilter,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        readBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      take: Number(limit),
      orderBy: {
        createdAt: "desc",
      },
    });
    res.json(messages.reverse());
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    res
      .status(500)
      .json({ error: "An unexpected error occurred while fetching messages." });
  }
};

// Get conversation analytics with AI integration
const getAnalyticsHandler: RequestHandler = async (req, res) => {
  const { conversationId } = req.params;
  const userId = (req as AuthenticatedRequest).user?.userId;

  try {
    if (!conversationId) {
      res.status(400).json({ error: "conversationId is required" });
      return;
    }

    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const prisma = await getPrismaClient();

    // First check if conversation exists and user is a member
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        members: {
          some: {
            id: userId,
          },
        },
      },
    });

    if (!conversation) {
      res
        .status(404)
        .json({ error: "Conversation not found or access denied" });
      return;
    }

    // Get all messages for the conversation
    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Basic stats
    const messageCount = messages.length;
    const totalWords = messages.reduce((count, message) => {
      const words = message.content?.trim().split(/\s+/) || [];
      return count + words.length;
    }, 0);

    // Check if conversation has been inactive for 1 hour
    const lastMessage = messages[messages.length - 1];
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const isInactive = lastMessage && lastMessage.createdAt < oneHourAgo;

    let summary = "";
    let sentiment: string[] = [];
    let sentimentTimeline: Array<{
      timestamp: string;
      sentiment: "positive" | "neutral" | "negative";
      messageCount: number;
    }> = [];
    let aiSuggestionsUsed = 0;

    // Generate AI summary and sentiment analysis for all conversations with messages
    if (messages.length > 0) {
      try {
        const aiResult = await AIService.summarizeConversation(messages);
        summary = aiResult.summary;
        sentiment = aiResult.sentiment;
        sentimentTimeline = aiResult.sentimentTimeline || [];
      } catch (aiError) {
        console.error("AI summary generation failed:", aiError);
        summary = "AI analysis failed. Please try again later.";
        // Provide default sentiment data if AI fails
        sentiment = messages.map(() => "neutral");
        sentimentTimeline = [];
      }
    } else {
      summary = "No messages in this conversation yet.";
      sentiment = [];
      sentimentTimeline = [];
    }

    // Count AI suggestions used (tracked via isAISuggestion field)
    aiSuggestionsUsed = messages.filter((msg) => msg.isAISuggestion).length;

    res.json({
      summary,
      stats: {
        messageCount,
        wordCount: totalWords,
        aiSuggestionsUsed,
        isInactive,
        lastActivity: lastMessage?.createdAt,
      },
      sentiment,
      sentimentTimeline,
    });
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    res.status(500).json({
      error: "An unexpected error occurred while fetching analytics.",
    });
  }
};

// Mark specific message as read
const markMessageAsReadHandler: RequestHandler = async (req, res) => {
  const { messageId } = req.params;
  const { userId } = req.body;

  try {
    if (!messageId || !userId) {
      res.status(400).json({ error: "messageId and userId are required" });
      return;
    }
    const prisma = await getPrismaClient();
    const message = await prisma.message.update({
      where: { id: messageId },
      data: {
        readBy: {
          connect: { id: userId },
        },
      },
      include: {
        readBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json({ success: true, message });
  } catch (error) {
    console.error("Failed to mark message as read:", error);
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string };
      if (prismaError.code === "P2025") {
        res.status(404).json({ error: "Message not found" });
        return;
      }
    }
    res.status(500).json({
      error: "An unexpected error occurred while marking message as read.",
    });
  }
};

// Get AI reply suggestions
const getReplySuggestionsHandler: RequestHandler = async (req, res) => {
  const { conversationId } = req.params;
  const { limit = 5 } = req.query;
  const userId = (req as AuthenticatedRequest).user?.userId;

  try {
    if (!conversationId) {
      res.status(400).json({ error: "conversationId is required" });
      return;
    }

    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const prisma = await getPrismaClient();

    // First check if conversation exists and user is a member
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        members: {
          some: {
            id: userId,
          },
        },
      },
    });

    if (!conversation) {
      res
        .status(404)
        .json({ error: "Conversation not found or access denied" });
      return;
    }

    // Get recent messages for context
    const recentMessages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      take: 10, // Last 10 messages for context
      orderBy: {
        createdAt: "desc",
      },
    });

    if (recentMessages.length === 0) {
      res.json({ suggestions: [] });
      return;
    }

    // Get AI suggestions
    const suggestions = await AIService.suggestReplies(
      recentMessages.reverse(),
    );

    res.json({ suggestions: suggestions.slice(0, Number(limit)) });
  } catch (error) {
    console.error("Failed to get reply suggestions:", error);
    res.status(500).json({
      error: "An unexpected error occurred while getting reply suggestions.",
    });
  }
};

// Create a new message in a conversation
const createMessageHandler: RequestHandler = async (req, res) => {
  const { conversationId } = req.params;
  const { content, isAISuggestion: rawIsAISuggestion } = req.body;
  const userId = (req as AuthenticatedRequest).user?.userId;

  // Default to false if not provided
  const isAISuggestion =
    typeof rawIsAISuggestion === "boolean" ? rawIsAISuggestion : false;

  try {
    if (!conversationId || !content) {
      res
        .status(400)
        .json({ error: "conversationId and content are required" });
      return;
    }
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const prisma = await getPrismaClient();

    // Check if conversation exists and user is a member
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        members: { some: { id: userId } },
      },
    });
    if (!conversation) {
      res
        .status(404)
        .json({ error: "Conversation not found or access denied" });
      return;
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        content,
        senderId: userId,
        conversationId,
        isAISuggestion,
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true },
        },
        readBy: {
          select: { id: true, name: true },
        },
      },
    });

    res.status(201).json(message);
  } catch (error) {
    console.error("Failed to create message:", error);
    res
      .status(500)
      .json({ error: "An unexpected error occurred while creating message." });
  }
};

// Apply authentication middleware to all routes
router.use(authenticateToken);

router.get("/:conversationId", getMessagesHandler);
router.get("/:conversationId/analytics", getAnalyticsHandler);
router.post("/:messageId/read", markMessageAsReadHandler);
router.get("/:conversationId/suggestions", getReplySuggestionsHandler);
router.post("/:conversationId", createMessageHandler);

export default router;
