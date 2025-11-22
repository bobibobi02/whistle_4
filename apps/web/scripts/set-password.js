// apps/web/scripts/set-password.js
/* eslint-disable no-console */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt"); // or bcryptjs if your project uses it
const prisma = new PrismaClient();

(async () => {
  const emailArg = process.argv[2];
  const newPass = process.argv[3];

  if (!emailArg || !newPass) {
    console.log('Usage: node scripts/set-password.js "<email>" "<newPassword>"');
    process.exit(1);
  }

  // Normalize to lowercase because SQLite doesn't support Prisma's `mode: 'insensitive'`
  const email = String(emailArg).toLowerCase();
  const passwordHash = await bcrypt.hash(newPass, 10);

  const user = await prisma.user.findFirst({
    where: { email },
  });

  if (!user) {
    // Create a minimal user if absent (adjust defaults as you wish)
    await prisma.user.create({
      data: {
        email,               // store lowercase
        name: "Dev User",
        passwordHash,        // requires the field to exist in schema
      },
    });
    console.log(`Created user ${emailArg} and set a password.`);
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });
    console.log(`Updated password for ${emailArg}.`);
  }

  await prisma.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});