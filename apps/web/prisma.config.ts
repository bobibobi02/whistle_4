import { defineConfig } from "@prisma/config";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.warn(
    "Warning: DATABASE_URL is not set. Prisma may fail to connect to the database."
  );
}

export default defineConfig({
  schema: "./prisma/schema.prisma",
});
