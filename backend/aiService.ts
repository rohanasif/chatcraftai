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

    // Log the context sent to OpenAI
    console.log("AI Suggestion Context:", context);

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

    // Log the raw response from OpenAI
    console.log(
      "AI Suggestion Raw Response:",
      response.choices[0].message.content,
    );

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

  static async summarizeConversation(
    messages: Message[],
  ): Promise<{ summary: string; sentiment: string[] }> {
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
          content:
            'Generate a 2-3 sentence summary of this conversation and analyze the sentiment over time. Return a JSON object with "summary" (string) and "sentiment" (array of strings) fields.',
        },
        {
          role: "user",
          content: context,
        },
      ],
      temperature: 0,
      response_format: { type: "json_object" },
    });

    const content =
      response.choices[0].message.content || '{"summary":"","sentiment":[]}';
    const result = JSON.parse(content);

    await redisClient.set(cacheKey, JSON.stringify(result), { EX: 86400 }); // Cache for 24 hours

    return result;
  }
}
