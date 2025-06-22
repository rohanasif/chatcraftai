import "@testing-library/jest-dom";

// Polyfill TextEncoder for jsdom environment
if (typeof global.TextEncoder === "undefined") {
  const { TextEncoder, TextDecoder } = require("util");
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Set test environment variables
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-key-for-testing-only";
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  "postgresql://test:test@localhost:5432/chatcraftai_test";
process.env.REDIS_URL =
  process.env.TEST_REDIS_URL || "redis://localhost:6379/1";
process.env.OPENAI_KEY = "test-openai-key";
process.env.OPENAI_DANGEROUSLY_ALLOW_BROWSER = "true";

// Increase timeout for all tests
jest.setTimeout(30000);

// Mock react-chartjs-2 for all tests
jest.mock("react-chartjs-2", () => ({
  Bar: jest.fn(() => null),
  Line: jest.fn(() => null),
  Pie: jest.fn(() => null),
  Doughnut: jest.fn(() => null),
}));

// Suppress jsdom canvas errors
Object.defineProperty(window.HTMLCanvasElement.prototype, "getContext", {
  value: () => ({}),
});

// Mock OpenAI before any imports
jest.mock("openai", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockImplementation((params) => {
            const systemContent = (
              params.messages.find((m) => m.role === "system")?.content || ""
            ).toLowerCase();

            // Grammar correction
            if (systemContent.includes("correct the grammar")) {
              return Promise.resolve({
                choices: [
                  {
                    message: {
                      content: "Corrected text response",
                    },
                  },
                ],
              });
            }
            // Reply suggestions
            if (systemContent.includes("reply suggestions")) {
              return Promise.resolve({
                choices: [
                  {
                    message: {
                      content: JSON.stringify({
                        replies: [
                          "Great to hear!",
                          "That's wonderful!",
                          "How was your day?",
                        ],
                      }),
                    },
                  },
                ],
              });
            }
            // Summary and sentiment
            if (
              systemContent.includes("summary") &&
              systemContent.includes("sentiment")
            ) {
              return Promise.resolve({
                choices: [
                  {
                    message: {
                      content: JSON.stringify({
                        summary:
                          "A friendly conversation between participants.",
                        sentiment: ["positive", "friendly"],
                      }),
                    },
                  },
                ],
              });
            }
            // Default
            return Promise.resolve({
              choices: [
                {
                  message: {
                    content: "Mocked AI response",
                  },
                },
              ],
            });
          }),
        },
      },
    })),
  };
});
