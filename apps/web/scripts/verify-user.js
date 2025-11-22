// scripts/verify-user.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function verifyPassword(input, stored) {
  if (typeof stored !== 'string' || !stored) return false;

  // Argon2 PHC format
  if (stored.startsWith('$argon2')) {
    try {
      const argon2 = await import('argon2');
      return await argon2.default.verify(stored, input);
    } catch (e) {
      console.warn("[verify] argon2 hash detected but 'argon2' package isn't installed.");
      return false;
    }
  }

  // bcrypt
  if (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')) {
    try { return await bcrypt.compare(input, stored); } catch { return false; }
  }

  // dev-only plain string fallback
  if (process.env.NODE_ENV !== 'production') return input === stored;

  return false;
}

(async () => {
  const email = process.argv[2];         // pass as arg 1
  const password = process.argv[3];      // pass as arg 2
  if (!email || !password) {
    console.log('Usage: node scripts/verify-user.js <email> <password>');
    process.exit(1);
  }

  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
  });

  if (!user) {
    console.log('No user for email:', email);
    await prisma.$disconnect();
    return;
  }

  const field =
    ('passwordHash' in user && user.passwordHash && 'passwordHash') ||
    ('hashedPassword' in user && user.hashedPassword && 'hashedPassword') ||
    ('password' in user && user.password && 'password') ||
    ('hash' in user && user.hash && 'hash') ||
    null;

  console.log('Found user id=', user.id, ' email=', user.email, ' hashField=', field || 'none');

  if (!field) {
    console.log('No password hash field on this user row.');
    await prisma.$disconnect();
    return;
  }

  const ok = await verifyPassword(password, user[field]);
  console.log('Password verify:', ok);
  await prisma.$disconnect();
})().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });