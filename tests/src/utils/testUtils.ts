import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import request from "supertest";
import express from "express";
import { getPrismaClient, resetDatabase } from "./pgliteTestUtils";

export interface TestUser {
  id: string;
  email: string;
  name: string;
  password: string;
  avatar?: string;
  isAdmin: boolean;
}

export interface TestConversation {
  id: string;
  title?: string;
  isGroup: boolean;
  isPublic: boolean;
  creatorId?: string;
  memberIds: string[];
}

export interface TestMessage {
  id: string;
  content: string;
  senderId: string;
  conversationId: string;
}

// Create a test user
export async function createTestUser(
  userData: Partial<TestUser> = {},
  prismaClient?: PrismaClient
): Promise<TestUser> {
  const defaultUser: TestUser = {
    id: "",
    email: `test-${Date.now()}@example.com`,
    name: "Test User",
    password: "password123",
    avatar: "https://example.com/avatar.jpg",
    isAdmin: false,
    ...userData,
  };

  const hashedPassword = await bcrypt.hash(defaultUser.password, 10);
  const prisma = prismaClient || (await getPrismaClient());

  const user = await prisma.user.create({
    data: {
      email: defaultUser.email,
      password: hashedPassword,
      name: defaultUser.name,
      avatar: defaultUser.avatar,
      isAdmin: defaultUser.isAdmin,
    },
  });

  return {
    ...defaultUser,
    id: user.id,
    password: defaultUser.password, // Return original password for testing
  };
}

// Create a test conversation
export async function createTestConversation(
  conversationData: Partial<TestConversation> = {},
  memberUsers: TestUser[] = [],
  prismaClient?: PrismaClient
): Promise<TestConversation> {
  const defaultConversation: TestConversation = {
    id: "",
    title: "Test Conversation",
    isGroup: false,
    isPublic: false,
    memberIds: [],
    ...conversationData,
  };

  // Create member users if not provided
  if (memberUsers.length === 0) {
    const user1 = await createTestUser({}, prismaClient);
    const user2 = await createTestUser({}, prismaClient);
    memberUsers = [user1, user2];
  }

  const prisma = prismaClient || (await getPrismaClient());
  const conversation = await prisma.conversation.create({
    data: {
      title: defaultConversation.title,
      isGroup: defaultConversation.isGroup,
      isPublic: defaultConversation.isPublic,
      creatorId: defaultConversation.creatorId,
      members: {
        connect: memberUsers.map((user) => ({ id: user.id })),
      },
    },
  });

  return {
    ...defaultConversation,
    id: conversation.id,
    memberIds: memberUsers.map((user) => user.id),
  };
}

// Create a test message
export async function createTestMessage(
  messageData: Partial<TestMessage> = {},
  sender?: TestUser,
  conversation?: TestConversation,
  prismaClient?: PrismaClient
): Promise<TestMessage> {
  if (!sender) {
    sender = await createTestUser({}, prismaClient);
  }

  if (!conversation) {
    conversation = await createTestConversation({}, [sender], prismaClient);
  }

  const defaultMessage: TestMessage = {
    id: "",
    content: "Test message content",
    senderId: sender.id,
    conversationId: conversation.id,
    ...messageData,
  };

  const prisma = prismaClient || (await getPrismaClient());
  const message = await prisma.message.create({
    data: {
      content: defaultMessage.content,
      senderId: defaultMessage.senderId,
      conversationId: defaultMessage.conversationId,
    },
  });

  return {
    ...defaultMessage,
    id: message.id,
  };
}

// Generate JWT token for a user
export function generateToken(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: "1h" });
}

// Create authenticated request
export function createAuthenticatedRequest(
  app: express.Application,
  userId: string
) {
  const token = generateToken(userId);
  return request(app)
    .set("Authorization", `Bearer ${token}`)
    .set("Cookie", `token=${token}`);
}

// Clean up test data
export async function cleanupTestData(
  prismaClient?: PrismaClient
): Promise<void> {
  if (prismaClient) {
    // Clean up specific tables in the provided database
    await prismaClient.message.deleteMany();
    await prismaClient.conversation.deleteMany();
    await prismaClient.user.deleteMany();
  } else {
    // Use PGlite reset
    await resetDatabase();
  }
}

// Mock OpenAI responses
export const mockOpenAIResponse = {
  choices: [
    {
      message: {
        content: "Mocked AI response",
      },
    },
  ],
};

// Mock Redis responses
export const mockRedisGet = jest.fn();
export const mockRedisSet = jest.fn();

// Setup mocks
export function setupMocks(): void {
  // Mock OpenAI
  jest.mock("openai", () => ({
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue(mockOpenAIResponse),
        },
      },
    })),
  }));

  // Mock Redis
  jest.mock("redis", () => ({
    createClient: jest.fn().mockImplementation(() => ({
      connect: jest.fn().mockResolvedValue(undefined),
      get: mockRedisGet,
      set: mockRedisSet,
      quit: jest.fn().mockResolvedValue(undefined),
    })),
  }));
}

// Reset mocks
export function resetMocks(): void {
  mockRedisGet.mockClear();
  mockRedisSet.mockClear();
}

// Setup and teardown functions for backend tests
export const setupTestDatabase = async () => {
  await resetDatabase();
};

export const teardownTestDatabase = async () => {
  await resetDatabase();
};
