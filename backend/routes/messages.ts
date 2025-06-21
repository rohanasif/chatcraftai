import express, { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../middleware/auth";
import { AIService } from "../aiService";

const router = express.Router();
const prisma = new PrismaClient();

// Get messages for a conversation
const getMessagesHandler: RequestHandler = async (req, res) => {
  const { conversationId } = req.params;
  const { limit = 50, cursor } = req.query;

  try {
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        ...(cursor ? { id: { lt: cursor as string } } : {}),
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

    res.json(messages.reverse()); // Return oldest first
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

// Get conversation analytics with AI integration
const getAnalyticsHandler: RequestHandler = async (req, res) => {
  const { conversationId } = req.params;

  try {
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
      return count + (message.content?.split(/\s+/).length || 0);
    }, 0);

    // Check if conversation has been inactive for 1 hour
    const lastMessage = messages[messages.length - 1];
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const isInactive = lastMessage && lastMessage.createdAt < oneHourAgo;

    let summary = "";
    let sentiment: string[] = [];
    let aiSuggestionsUsed = 0;

    // Generate AI summary if conversation is inactive
    if (isInactive && messages.length > 0) {
      try {
        const aiResult = await AIService.summarizeConversation(messages);
        summary = aiResult.summary;
        sentiment = aiResult.sentiment;
      } catch (aiError) {
        console.error("AI summary generation failed:", aiError);
        summary = "AI summary generation failed. Please try again later.";
      }
    }

    // Count AI suggestions used (this would need to be tracked in messages)
    // For now, we'll estimate based on message patterns
    aiSuggestionsUsed = Math.floor(messageCount * 0.1); // Rough estimate

    res.json({
      summary:
        summary ||
        "Conversation is still active. Summary will be available after 1 hour of inactivity.",
      stats: {
        messageCount,
        wordCount: totalWords,
        aiSuggestionsUsed,
        isInactive,
        lastActivity: lastMessage?.createdAt,
      },
      sentiment,
    });
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
};

// Mark specific message as read
const markMessageAsReadHandler: RequestHandler = async (req, res) => {
  const { messageId } = req.params;
  const { userId } = req.body;

  try {
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
    res.status(500).json({ error: "Failed to mark message as read" });
  }
};

// Get AI reply suggestions
const getReplySuggestionsHandler: RequestHandler = async (req, res) => {
  const { conversationId } = req.params;
  const { limit = 5 } = req.query;

  try {
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
    res.status(500).json({ error: "Failed to get reply suggestions" });
  }
};

// Apply authentication middleware to all routes
router.use(authenticateToken);

router.get("/:conversationId", getMessagesHandler);
router.get("/:conversationId/analytics", getAnalyticsHandler);
router.post("/:messageId/read", markMessageAsReadHandler);
router.get("/:conversationId/suggestions", getReplySuggestionsHandler);

export default router;
