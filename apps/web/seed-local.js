// apps/web/seed-local.js
(async () => {
  const { PrismaClient } = require('@prisma/client');
  const bcrypt = require('bcryptjs');
  const prisma = new PrismaClient();
  try {
    // 1) User (your dev login)
    const email = 'bobi02@example.com';
    const password = 'Dune2001'; // same as before
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        name: 'bobi02',
        email,
        hashedPassword: await bcrypt.hash(password, 10),
      },
    });

    // 2) Subforum
    const subforum = await prisma.subforum.upsert({
      where: { name: 'General' },
      update: {},
      create: { name: 'General', description: 'Default subforum' },
    });

    // 3) A hello post so the feed isnвЂ™t empty
    const post = await prisma.post.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        title: 'We are back вњ…',
        content:
          'The database was reset after migration, so this is a fresh seed post. Continue creating posts as usual.',
        subforumName: subforum.name,
      },
    });

    console.log('Seeded:', { user: { id: user.id, email: user.email }, subforum: subforum.name, post: post.id });
  } catch (e) {
    console.error('Seed error:', e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();