import OpenAI from "openai";
import { createClient } from "redis";

// Lazy OpenAI initialization
let openai: OpenAI | null = null;

function getOpenAIClient() {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_KEY,
      dangerouslyAllowBrowser: process.env.NODE_ENV === "test",
    });
  }
  return openai;
}

// Lazy Redis connection
let redis: ReturnType<typeof createClient> | null = null;

async function getRedisClient() {
  if (!redis) {
    redis = createClient({
      url: process.env.REDIS_URL,
    });
    await redis.connect();
  }
  return redis;
}

// Cleanup function for tests
export async function cleanupRedis() {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

interface Message {
  sender: {
    name: string;
  };
  content: string;
}

export class AIService {
  static async correctGrammar(text: string): Promise<string> {
    const redisClient = await getRedisClient();
    const cacheKey = `grammar:${text}`;
    const cached = await redisClient.get(cacheKey);

    if (cached) {
      const cachedStr = typeof cached === "string" ? cached : cached.toString();
      return cachedStr;
    }

    const openaiClient = getOpenAIClient();
    const response = await openaiClient.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "Correct the grammar and spelling of the following text. Return only the corrected text.",
        },
        {
          role: "user",
          content: text,
        },
      ],
      temperature: 0,
    });

    const corrected = response.choices[0].message.content || text;
    await redisClient.set(cacheKey, corrected, { EX: 3600 }); // Cache for 1 hour

    return corrected;
  }

  static async suggestReplies(messages: Message[]): Promise<string[]> {
    const redisClient = await getRedisClient();
    // Exclude the most recent message for follow-up suggestions
    const contextMessages = messages.slice(0, -1);
    const context = contextMessages
      .map((m) => `${m.sender.name}: ${m.content}`)
      .join("\n");
    const cacheKey = `replies:${context}`;
    const cached = await redisClient.get(cacheKey);

    if (cached) {
      const cachedStr = typeof cached === "string" ? cached : cached.toString();
      return JSON.parse(cachedStr);
    }

    const openaiClient = getOpenAIClient();
    const response = await openaiClient.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "Generate 3-5 short, relevant follow-up message suggestions based on the conversation so far. Do NOT reply to the most recent message. Return a JSON object with a 'replies' key containing an array of strings.",
        },
        {
          role: "user",
          content: context,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content || '{"replies":[]}';
    try {
      const parsedContent = JSON.parse(content);
      const replies = parsedContent.replies || [];
      if (Array.isArray(replies)) {
        await redisClient.set(cacheKey, JSON.stringify(replies), { EX: 3600 });
        return replies;
      }
      return [];
    } catch (e) {
      console.error("Failed to parse AI suggestions:", e);
      return [];
    }
  }

  static async summarizeConversation(messages: Message[]): Promise<{
    summary: string;
    sentiment: string[];
    sentimentTimeline?: Array<{
      timestamp: string;
      sentiment: "positive" | "neutral" | "negative";
      messageCount: number;
    }>;
  }> {
    const redisClient = await getRedisClient();
    const context = messages
      .map((m) => `${m.sender.name}: ${m.content}`)
      .join("\n");
    const cacheKey = `summary:${context}`;
    const cached = await redisClient.get(cacheKey);

    if (cached) {
      const cachedStr = typeof cached === "string" ? cached : cached.toString();
      return JSON.parse(cachedStr);
    }

    const openaiClient = getOpenAIClient();
    const response = await openaiClient.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant that analyzes conversations and provides sentiment analysis.

For each message in the conversation, analyze the sentiment and provide:
1. A 2-3 sentence summary of the overall conversation
2. An array of sentiment labels for each message (only "positive", "neutral", or "negative")
3. A sentiment timeline showing how sentiment changed over time

Return a JSON object with this exact structure:
{
  "summary": "Brief summary of the conversation",
  "sentiment": ["positive", "neutral", "negative", ...],
  "sentimentTimeline": [
    {
      "timestamp": "2024-01-01T10:00:00Z",
      "sentiment": "positive",
      "messageCount": 5
    }
  ]
}

Guidelines:
- sentiment array should have one entry per message in the conversation
- sentimentTimeline should group messages into time periods and show sentiment trends
- Use realistic timestamps based on message order
- Be consistent with sentiment analysis - positive for happy/agreeable content, negative for angry/sad content, neutral for factual/informative content`,
        },
        {
          role: "user",
          content: `Analyze this conversation:\n\n${context}`,
        },
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const content =
      response.choices[0].message.content ||
      '{"summary":"","sentiment":[],"sentimentTimeline":[]}';

    try {
      const result = JSON.parse(content);

      // Validate and clean the result
      const validatedResult = {
        summary: result.summary || "No summary available",
        sentiment: Array.isArray(result.sentiment) ? result.sentiment : [],
        sentimentTimeline: Array.isArray(result.sentimentTimeline)
          ? result.sentimentTimeline
          : [],
      };

      // Ensure sentiment array has correct length
      if (validatedResult.sentiment.length !== messages.length) {
        // Generate default sentiment array if length doesn't match
        validatedResult.sentiment = messages.map(() => "neutral");
      }

      // Validate sentiment values
      validatedResult.sentiment = validatedResult.sentiment.map((s) =>
        ["positive", "neutral", "negative"].includes(s) ? s : "neutral",
      );

      await redisClient.set(cacheKey, JSON.stringify(validatedResult), {
        EX: 86400,
      }); // Cache for 24 hours
      return validatedResult;
    } catch (error) {
      console.error("Failed to parse AI summary response:", error);
      // Return default structure if parsing fails
      return {
        summary: "AI analysis failed. Please try again later.",
        sentiment: messages.map(() => "neutral"),
        sentimentTimeline: [],
      };
    }
  }
}
