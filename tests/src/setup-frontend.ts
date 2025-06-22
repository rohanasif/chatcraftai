import "@testing-library/jest-dom";

// Polyfill TextEncoder for jsdom environment
if (typeof global.TextEncoder === "undefined") {
  const { TextEncoder, TextDecoder } = require("util");
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Polyfill fetch for OpenAI client
if (typeof global.fetch === "undefined") {
  global.fetch = require("node-fetch");
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
if (typeof window !== "undefined") {
  Object.defineProperty(window.HTMLCanvasElement.prototype, "getContext", {
    value: () => ({}),
  });
}
