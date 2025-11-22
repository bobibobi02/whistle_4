// prisma/seed.cjs
/* eslint-disable no-console */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // 1) Create (or reuse) a main user
  const adminEmail = "admin@whistle.app";
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Admin",
      image: null,
      passwordHash: null,
    },
  });

  // 2) Create (or reuse) a few starter subforums
  const subforumsToCreate = [
    { name: "general", title: "General", description: "Main Whistle feed" },
    { name: "news", title: "News", description: "What’s happening" },
    { name: "tech", title: "Tech", description: "Tech, AI, and dev" },
  ];

  const subforums = [];
  for (const sf of subforumsToCreate) {
    const created = await prisma.subforum.upsert({
      where: { name: sf.name },
      update: {
        title: sf.title,
        description: sf.description,
      },
      create: {
        name: sf.name,
        title: sf.title,
        description: sf.description,
        creatorId: admin.id,
      },
    });
    subforums.push(created);
  }

  // 3) Only create sample posts if DB has none
  const postCount = await prisma.post.count();
  if (postCount === 0) {
    console.log("📝 Creating sample posts...");

    const [general, news, tech] = subforums;

    await prisma.post.createMany({
      data: [
        {
          title: "Welcome to Whistle 👋",
          content: "This is your first seeded post. Feel free to delete it!",
          userId: admin.id,
          userEmail: admin.email,
          userName: admin.name,
          subforumId: general.id,
        },
        {
          title: "Whistle is live on Neon + Vercel!",
          content:
            "Database is now PostgreSQL on Neon. Everything should work in prod.",
          userId: admin.id,
          userEmail: admin.email,
          userName: admin.name,
          subforumId: news.id,
        },
        {
          title: "Tech loop is open",
          content:
            "Post dev updates, AI stuff, and bugs here. Let’s ship this MVP.",
          userId: admin.id,
          userEmail: admin.email,
          userName: admin.name,
          subforumId: tech.id,
        },
      ],
    });
  } else {
    console.log(`✅ Posts already exist (${postCount}). Skipping sample posts.`);
  }

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });