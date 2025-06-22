// Polyfill TextEncoder for Node environment
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
process.env.REDIS_URL =
  process.env.TEST_REDIS_URL || "redis://localhost:6379/1";
process.env.OPENAI_KEY = "test-openai-key";
process.env.OPENAI_DANGEROUSLY_ALLOW_BROWSER = "true";

// Increase timeout for all tests
jest.setTimeout(30000);

// Initialize pglite for testing and inject into backend
beforeAll(async () => {
  const { initializePGlite } = require("./utils/pgliteTestUtils");
  const { initializePrisma } = require("../../backend/lib/prisma");

  // Initialize pglite and get the Prisma client
  const { prisma } = await initializePGlite();

  // Inject the pglite-based Prisma client into the backend
  initializePrisma(prisma);
});

// Global teardown to clean up resources
afterAll(async () => {
  // Import cleanup functions
  const { cleanupRedis } = require("../../backend/aiService");
  const { cleanupPGlite } = require("./utils/pgliteTestUtils");

  try {
    await cleanupRedis();
    await cleanupPGlite();
  } catch (error) {
    console.error("Error during global teardown:", error);
  }
});
