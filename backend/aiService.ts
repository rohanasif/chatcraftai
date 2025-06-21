import OpenAI from "openai";
import { createClient } from "redis";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

const redis = createClient({
  url: process.env.REDIS_URL,
});

redis.connect();

interface Message {
  sender: {
    name: string;
  };
  content: string;
}

export class AIService {
  static async correctGrammar(text: string): Promise<string> {
    const cacheKey = `grammar:${text}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      const cachedStr = typeof cached === "string" ? cached : cached.toString();
      return cachedStr;
    }

    const response = await openai.chat.completions.create({
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
    await redis.set(cacheKey, corrected, { EX: 3600 }); // Cache for 1 hour

    return corrected;
  }

  static async suggestReplies(messages: Message[]): Promise<string[]> {
    const context = messages
      .map((m) => `${m.sender.name}: ${m.content}`)
      .join("\n");
    const cacheKey = `replies:${context}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      const cachedStr = typeof cached === "string" ? cached : cached.toString();
      return JSON.parse(cachedStr);
    }

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "Generate 3-5 short reply suggestions based on the conversation context. Return a JSON array of strings.",
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
    const replies = JSON.parse(content).replies || [];

    await redis.set(cacheKey, JSON.stringify(replies), { EX: 3600 });

    return replies;
  }

  static async summarizeConversation(
    messages: Message[],
  ): Promise<{ summary: string; sentiment: string[] }> {
    const context = messages
      .map((m) => `${m.sender.name}: ${m.content}`)
      .join("\n");
    const cacheKey = `summary:${context}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      const cachedStr = typeof cached === "string" ? cached : cached.toString();
      return JSON.parse(cachedStr);
    }

    const response = await openai.chat.completions.create({
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

    await redis.set(cacheKey, JSON.stringify(result), { EX: 86400 }); // Cache for 24 hours

    return result;
  }
}
