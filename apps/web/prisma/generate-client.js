// prisma/generate-client.js
const { execSync } = require("child_process");

try {
  execSync("npx prisma generate --schema=./prisma/schema.prisma", {
    stdio: "inherit",
  });
} catch (err) {
  console.error("вќЊ Prisma client generation failed:", err.message);
  process.exit(1);
}