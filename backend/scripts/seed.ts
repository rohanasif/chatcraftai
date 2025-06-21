import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@chatcraft.com" },
    update: {},
    create: {
      email: "admin@chatcraft.com",
      password: adminPassword,
      name: "Admin User",
      avatar: "https://via.placeholder.com/150",
      isAdmin: true,
    },
  });

  // Create regular users
  const user1Password = await bcrypt.hash("user123", 10);
  const user1 = await prisma.user.upsert({
    where: { email: "user1@chatcraft.com" },
    update: {},
    create: {
      email: "user1@chatcraft.com",
      password: user1Password,
      name: "John Doe",
      avatar: "https://via.placeholder.com/150",
      isAdmin: false,
    },
  });

  const user2Password = await bcrypt.hash("user123", 10);
  const user2 = await prisma.user.upsert({
    where: { email: "user2@chatcraft.com" },
    update: {},
    create: {
      email: "user2@chatcraft.com",
      password: user2Password,
      name: "Jane Smith",
      avatar: "https://via.placeholder.com/150",
      isAdmin: false,
    },
  });

  // Create a public group
  const publicGroup = await prisma.conversation.upsert({
    where: { id: "public-group-1" },
    update: {},
    create: {
      id: "public-group-1",
      title: "General Discussion",
      isGroup: true,
      isPublic: true,
      creator: { connect: { id: admin.id } },
      members: {
        connect: [{ id: admin.id }, { id: user1.id }, { id: user2.id }],
      },
    },
  });

  // Create some sample messages
  await prisma.message.createMany({
    skipDuplicates: true,
    data: [
      {
        content:
          "Welcome to ChatCraftAI! This is a public group for general discussion.",
        senderId: admin.id,
        conversationId: publicGroup.id,
      },
      {
        content: "Thanks for the welcome! This looks like a great platform.",
        senderId: user1.id,
        conversationId: publicGroup.id,
      },
      {
        content: "I'm excited to try out the AI features!",
        senderId: user2.id,
        conversationId: publicGroup.id,
      },
    ],
  });

  console.log("✅ Database seeded successfully!");
  console.log("📧 Admin email: admin@chatcraft.com");
  console.log("🔑 Admin password: admin123");
  console.log("📧 User1 email: user1@chatcraft.com");
  console.log("🔑 User1 password: user123");
  console.log("📧 User2 email: user2@chatcraft.com");
  console.log("🔑 User2 password: user123");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
