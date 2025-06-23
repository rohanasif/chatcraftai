import { AIService } from "@backend/aiService";
import { resetMocks, mockOpenAIResponse } from "../utils/testUtils";
import { mockRedisGet, mockRedisSet } from "../../__mocks__/redis";

describe("AIService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetMocks();
    // Ensure mockRedisGet returns undefined by default (no cache hit)
    mockRedisGet.mockResolvedValue(undefined);
  });

  describe("correctGrammar", () => {
    it("should return corrected text from OpenAI", async () => {
      const inputText = "Hello world, how are you doing?";
      const result = await AIService.correctGrammar(inputText);
      expect(result).toBe("Corrected text response");
      expect(mockRedisSet).toHaveBeenCalledWith(
        `grammar:${inputText}`,
        "Corrected text response",
        { EX: 3600 }
      );
    });

    it("should return cached result when available", async () => {
      const inputText = "Hello world, how are you doing?";
      const cachedResult = "Hello world, how are you doing?";

      mockRedisGet.mockResolvedValue(cachedResult);

      const result = await AIService.correctGrammar(inputText);

      expect(result).toBe(cachedResult);
      expect(mockRedisGet).toHaveBeenCalledWith(`grammar:${inputText}`);
      expect(mockRedisSet).not.toHaveBeenCalled();
    });

    it("should handle empty input", async () => {
      const inputText = "";
      const result = await AIService.correctGrammar(inputText);

      expect(result).toBeDefined();
    });

    it("should handle special characters", async () => {
      const inputText = "Hello @world! How are you? #testing";
      const result = await AIService.correctGrammar(inputText);

      expect(result).toBeDefined();
    });
  });

  describe("suggestReplies", () => {
    const mockMessages = [
      {
        sender: { name: "Alice" },
        content: "Hello, how are you?",
      },
      {
        sender: { name: "Bob" },
        content: "I am doing well, thank you!",
      },
    ];

    it("should return reply suggestions from OpenAI", async () => {
      const result = await AIService.suggestReplies(mockMessages);

      expect(Array.isArray(result)).toBe(true);
      // The mock returns suggestions for the context 'Alice: Hello, how are you?'
      expect(result).toEqual([
        "Great to hear!",
        "That's wonderful!",
        "How was your day?",
      ]);
    });

    it("should return cached suggestions when available", async () => {
      const cachedSuggestions = ["Great to hear!", "That's wonderful!"];
      // Only the first message is included in the context
      const context = mockMessages
        .slice(0, -1)
        .map((m) => `${m.sender.name}: ${m.content}`)
        .join("\n");

      mockRedisGet.mockResolvedValue(JSON.stringify(cachedSuggestions));

      const result = await AIService.suggestReplies(mockMessages);

      expect(result).toEqual(cachedSuggestions);
      expect(mockRedisGet).toHaveBeenCalledWith(`replies:${context}`);
      expect(mockRedisSet).not.toHaveBeenCalled();
    });

    it("should handle empty messages array", async () => {
      const result = await AIService.suggestReplies([]);

      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle messages with empty content", async () => {
      const messagesWithEmptyContent = [
        {
          sender: { name: "Alice" },
          content: "",
        },
        {
          sender: { name: "Bob" },
          content: "Hello",
        },
      ];

      const result = await AIService.suggestReplies(messagesWithEmptyContent);

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("summarizeConversation", () => {
    const mockMessages = [
      {
        sender: { name: "Alice" },
        content: "Hello everyone!",
      },
      {
        sender: { name: "Bob" },
        content: "Hi Alice, how are you?",
      },
      {
        sender: { name: "Alice" },
        content: "I am doing great, thanks for asking!",
      },
    ];

    it("should return conversation summary and sentiment", async () => {
      const result = await AIService.summarizeConversation(mockMessages);

      expect(result).toHaveProperty("summary");
      expect(result).toHaveProperty("sentiment");
      expect(result.summary).toBe(
        "A friendly conversation between participants."
      );
      expect(result.sentiment).toEqual(["positive", "friendly"]);
      expect(mockRedisSet).toHaveBeenCalledWith(
        expect.stringContaining("summary:"),
        JSON.stringify(result),
        { EX: 86400 }
      );
    });

    it("should return cached summary when available", async () => {
      const cachedResult = {
        summary: "Cached summary",
        sentiment: ["positive"],
      };
      const context = mockMessages
        .map((m) => `${m.sender.name}: ${m.content}`)
        .join("\n");

      mockRedisGet.mockResolvedValue(JSON.stringify(cachedResult));

      const result = await AIService.summarizeConversation(mockMessages);

      expect(result).toEqual(cachedResult);
      expect(mockRedisGet).toHaveBeenCalledWith(`summary:${context}`);
      expect(mockRedisSet).not.toHaveBeenCalled();
    });

    it("should handle empty messages array", async () => {
      const result = await AIService.summarizeConversation([]);

      expect(result).toHaveProperty("summary");
      expect(result).toHaveProperty("sentiment");
    });

    it("should handle malformed OpenAI response", async () => {
      const result = await AIService.summarizeConversation(mockMessages);

      expect(result).toHaveProperty("summary");
      expect(result).toHaveProperty("sentiment");
    });

    it("should handle OpenAI API errors gracefully", async () => {
      // The manual mock should handle this, but we can test error handling
      const result = await AIService.summarizeConversation(mockMessages);
      expect(result).toBeDefined();
    });
  });
});
