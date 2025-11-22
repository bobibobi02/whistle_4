const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const email = "bobster2811@gmail.com"; // your login email
  const name = "Bobster";

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log("User already exists with id:", existing.id);
    return;
  }

  const user = await prisma.user.create({
    data: {
      email,
      name,
      // passwordHash can stay null for now – login is already working via your existing session
    },
  });

  console.log("Created dev user with id:", user.id);
}

main()
  .catch((e) => {
    console.error("Error creating dev user:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
