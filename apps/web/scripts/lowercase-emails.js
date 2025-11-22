/* eslint-disable no-console */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  let changed = 0;

  for (const u of users) {
    const lower = (u.email || "").toLowerCase();
    if (u.email !== lower) {
      await prisma.user.update({ where: { id: u.id }, data: { email: lower } });
      changed++;
    }
  }
  console.log(`Lowercased ${changed} user emails.`);
}

main().finally(() => prisma.$disconnect());