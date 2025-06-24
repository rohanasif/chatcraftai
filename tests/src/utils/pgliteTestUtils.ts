import { PGlite } from "@electric-sql/pglite";
import { PrismaClient } from "@prisma/client";
import { PrismaPGlite } from "pglite-prisma-adapter";
import path from "path";
import fs from "fs";

let pglite: PGlite | null = null;
let prisma: PrismaClient | null = null;
let dbPath: string | null = null;

export interface PGliteTestConfig {
  dbPath?: string;
  schemaPath?: string;
}

export async function initializePGlite(config: PGliteTestConfig = {}): Promise<{
  pglite: PGlite;
  prisma: PrismaClient;
  dbPath: string;
}> {
  if (pglite && prisma && dbPath) {
    return { pglite, prisma, dbPath };
  }

  // Use a single database path for all tests
  const testDbPath = config.dbPath || path.join(process.cwd(), "test-db.db");

  // Ensure the directory exists
  const dbDir = path.dirname(testDbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Initialize PGlite
  pglite = new PGlite({
    dataDir: testDbPath,
  });

  // Get the connection string
  const connectionString = await pglite.uri;

  // Set environment variables for Prisma
  process.env.DATABASE_URL = connectionString;
  process.env.DIRECT_URL = connectionString;

  // Initialize Prisma client with pglite adapter
  const adapter = new PrismaPGlite(pglite);
  prisma = new PrismaClient({ adapter });

  // Run migrations
  await runMigrations();

  dbPath = testDbPath;
  return { pglite, prisma, dbPath };
}

async function runMigrations(): Promise<void> {
  if (!prisma) {
    throw new Error("Prisma client not initialized");
  }

  // Create tables based on the schema - use the test schema
  const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");

  // Read the schema file
  const schemaContent = fs.readFileSync(schemaPath, "utf-8");

  // Extract SQL from the schema (this is a simplified approach)
  // In a real implementation, you might want to use Prisma's migration system
  const sqlStatements = generateSQLFromSchema(schemaContent);

  // Execute the SQL statements
  for (const sql of sqlStatements) {
    await prisma.$executeRawUnsafe(sql);
  }
}

function generateSQLFromSchema(schemaContent: string): string[] {
  // This is a simplified SQL generation - in production, you'd use Prisma's migration system
  return [
    `CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT PRIMARY KEY,
      "email" TEXT UNIQUE NOT NULL,
      "password" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "avatar" TEXT,
      "isAdmin" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS "Conversation" (
      "id" TEXT PRIMARY KEY,
      "title" TEXT,
      "isGroup" BOOLEAN NOT NULL DEFAULT false,
      "isPublic" BOOLEAN NOT NULL DEFAULT false,
      "creatorId" TEXT,
      "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS "Message" (
      "id" TEXT PRIMARY KEY,
      "content" TEXT NOT NULL,
      "senderId" TEXT NOT NULL,
      "conversationId" TEXT NOT NULL,
      "isAISuggestion" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE,
      FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "_ConversationMembers" (
      "A" TEXT NOT NULL,
      "B" TEXT NOT NULL,
      FOREIGN KEY ("A") REFERENCES "Conversation"("id") ON DELETE CASCADE,
      FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE,
      PRIMARY KEY ("A", "B")
    )`,
    `CREATE TABLE IF NOT EXISTS "_MessageReadBy" (
      "A" TEXT NOT NULL,
      "B" TEXT NOT NULL,
      FOREIGN KEY ("A") REFERENCES "Message"("id") ON DELETE CASCADE,
      FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE,
      PRIMARY KEY ("A", "B")
    )`,
    `CREATE INDEX IF NOT EXISTS "_ConversationMembers_B_index" ON "_ConversationMembers"("B")`,
    `CREATE INDEX IF NOT EXISTS "_MessageReadBy_B_index" ON "_MessageReadBy"("B")`,
  ];
}

export async function getPrismaClient(): Promise<PrismaClient> {
  if (!prisma) {
    await initializePGlite();
  }
  return prisma!;
}

export async function disconnectPGlite(): Promise<void> {
  if (prisma) {
    try {
      await prisma.$disconnect();
    } catch (error) {
      console.warn("Error disconnecting Prisma client:", error);
    }
    prisma = null;
  }

  if (pglite) {
    try {
      await pglite.close();
    } catch (error) {
      console.warn("Error closing PGlite:", error);
    }
    pglite = null;
  }
}

export async function cleanupPGlite(): Promise<void> {
  // First disconnect
  await disconnectPGlite();

  // Then clean up the database directory
  if (dbPath && fs.existsSync(dbPath)) {
    try {
      // Check if it's a directory and remove it recursively
      const stats = fs.statSync(dbPath);
      if (stats.isDirectory()) {
        fs.rmSync(dbPath, { recursive: true, force: true });
        console.log(`🧹 Cleaned up test database directory: ${dbPath}`);
      } else {
        fs.unlinkSync(dbPath);
        console.log(`🧹 Cleaned up test database file: ${dbPath}`);
      }
    } catch (error) {
      console.warn("Could not delete test database directory:", error);
    }
    dbPath = null;
  }
}

export async function resetDatabase(): Promise<void> {
  const client = await getPrismaClient();

  // Clear all data, including join tables
  await client.$executeRawUnsafe('DELETE FROM "_MessageReadBy"');
  await client.$executeRawUnsafe('DELETE FROM "_ConversationMembers"');
  await client.message.deleteMany();
  await client.conversation.deleteMany();
  await client.user.deleteMany();
}
