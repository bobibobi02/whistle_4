const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Deleting Votes, Comments, Posts...");

  await prisma.vote.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.post.deleteMany({});

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
