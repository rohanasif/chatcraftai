import { PrismaClient } from "@prisma/client";

// Create a singleton Prisma client
let prisma: PrismaClient | null = null;

// Function to initialize Prisma client (useful for testing)
export async function initializePrisma(
  client?: PrismaClient,
): Promise<PrismaClient> {
  if (client) {
    prisma = client;
  } else if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma!;
}

// Get the current Prisma client instance
export async function getPrismaClient(): Promise<PrismaClient> {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma!;
}

// Export the default client for backward compatibility
export default getPrismaClient;
